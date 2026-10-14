# Git Integration

**Project:** Student Assignment Review AI  
**Backend:** Laravel  
**Database:** MySQL

---

## 1. Overview

This document describes how the system connects to Git hosting providers, registers repositories, resolves commits, and retrieves repository content safely for AI analysis.

Related documents:

- `docs/business/business-rules.md` (rules `BR-GIT-*`, `BR-ARP-*`, `BR-SRP-*`, `BR-SUB-05`, `BR-ANL-11` to `BR-ANL-16`)
- `docs/business/ai-review.md`
- `docs/backend/architecture.md`
- `docs/backend/api.md`
- `docs/backend/authorization.md`
- `docs/backend/error-handling.md`
- `docs/backend/testing.md`

### 1.1 What Git Integration Is Used For

| Use | Who |
|---|---|
| Connect a Git provider account | Teachers and students |
| Register repositories the account can access | Teachers and students |
| Link `TEMPLATE` and `REFERENCE` repositories to assignments | Teachers |
| Link a student repository to an assignment | Students |
| Resolve a branch to an exact commit SHA when submitting | System |
| Retrieve repository content at a commit for analysis | System (background job) |

### 1.2 What Git Integration Does Not Do

- It does not log users in to this application (see `docs/backend/authentication.md`, section 12).
- It does not write to repositories: no commits, pushes, branches, issues, or comments.
- It does not run code, scripts, hooks, or build steps from repositories.
- It does not create repositories for students from templates in the current version.

---

## 2. Supported Providers

| Provider | Status |
|---|---|
| GitHub (`github.com`) | Supported |
| GitLab (`gitlab.com`) | Planned |
| Self-hosted providers | Not supported |

Each provider is implemented behind a common interface (section 4.2), so adding a provider does not change the rest of the application.

### 2.1 Allowed Hosts

Only hosts in the allowlist can be used:

```php
// config/git.php

return [
    'providers' => [
        'github' => [
            'enabled' => true,
            'web_host' => 'github.com',
            'api_base_url' => 'https://api.github.com',
            'api_version' => '2022-11-28',
        ],
        'gitlab' => [
            'enabled' => false,
            'web_host' => 'gitlab.com',
            'api_base_url' => 'https://gitlab.com/api/v4',
        ],
    ],

    'http_timeout_seconds' => env('GIT_HTTP_TIMEOUT', 30),
    'download_timeout_seconds' => env('GIT_DOWNLOAD_TIMEOUT', 120),
    'repository_max_size_mb' => env('REVIEW_REPOSITORY_MAX_SIZE_MB', 100),
    'max_file_count' => env('GIT_MAX_FILE_COUNT', 5000),
    'workspace_disk' => 'git-workspace',
];
```

---

## 3. Authentication with Providers

### 3.1 Personal Access Tokens

In the current version, users connect a provider by entering a **personal access token**.

For GitHub, users should create a **fine-grained personal access token** with:

| Setting | Value |
|---|---|
| Repository access | Only the repositories needed for the course |
| Permissions → Contents | Read-only |
| Permissions → Metadata | Read-only (required by GitHub) |
| Expiration | A date covering the course period |

The system never needs write permissions. If a token has more permissions than needed, it still works, but users should be encouraged to use the minimum.

### 3.2 OAuth (Future)

Connecting through an OAuth app ("Connect with GitHub") is planned. When added:

- The OAuth token is stored the same way as personal access tokens.
- The requested scope is read-only.
- The flow is documented in a new section of this file.

### 3.3 Token Storage

| ID | Rule |
|---|---|
| `BR-GIT-02` | A connection is private to its owner, including from admins. |
| `BR-GIT-03` | Tokens are encrypted at rest and never returned, logged, or sent to the AI provider. |

```php
// app/Models/GitConnection.php

protected $hidden = [
    'access_token',
];

protected function casts(): array
{
    return [
        'access_token' => 'encrypted',
        'token_verified_at' => 'datetime',
        'token_expires_at' => 'datetime',
    ];
}
```

- The `encrypted` cast uses `APP_KEY`. Rotating `APP_KEY` without `APP_PREVIOUS_KEYS` makes stored tokens unreadable.
- The `access_token` column must be `TEXT`, because encrypted values are longer than the original token.
- Jobs receive the connection or repository **ID**, never the token value, so tokens are not stored in the queue.

---

## 4. Components

### 4.1 Overview

```text
Controllers / Services
        |
        v
GitRepositoryService  ─────────────►  RepositoryUrlParser
        |                             (validates and parses URLs)
        v
GitProviderManager
        |
        v
GitProviderClient (interface)
   ├── GitHubClient
   └── GitLabClient (planned)
        |
        v
RepositoryWorkspace
(downloads, extracts, filters, and cleans up repository files)
```

| Component | Location | Responsibility |
|---|---|---|
| `GitRepositoryService` | `app/Services/Git/` | Coordinates connections, repository registration, commit resolution, and content retrieval |
| `RepositoryUrlParser` | `app/Services/Git/` | Validates repository URLs and extracts provider, owner, and name |
| `GitProviderManager` | `app/Services/Git/` | Returns the correct client for a provider |
| `GitProviderClient` | `app/Services/Git/Contracts/` | Interface for provider API calls |
| `GitHubClient` | `app/Services/Git/Providers/` | GitHub implementation |
| `RepositoryWorkspace` | `app/Services/Git/` | Safe temporary storage for downloaded repository content |
| `CloneGitRepositoryJob` | `app/Jobs/Git/` | Optional: retrieves content ahead of analysis |

Names are suggestions. Follow the existing code if different names are already used.

### 4.2 Provider Client Interface

```php
// app/Services/Git/Contracts/GitProviderClient.php

namespace App\Services\Git\Contracts;

use App\Services\Git\Data\GitAccount;
use App\Services\Git\Data\GitCommit;
use App\Services\Git\Data\GitRepositoryInfo;

interface GitProviderClient
{
    /** Verify the token and return the account it belongs to. */
    public function verifyToken(string $token): GitAccount;

    /** Return repository details if the token can access it. */
    public function getRepository(string $token, string $owner, string $name): GitRepositoryInfo;

    /** Resolve a branch, tag, or SHA to an exact commit. */
    public function resolveCommit(string $token, string $owner, string $name, string $ref): GitCommit;

    /** Download an archive of the repository at an exact commit SHA to a local path. */
    public function downloadArchive(
        string $token,
        string $owner,
        string $name,
        string $commitSha,
        string $destinationPath
    ): void;
}
```

The `Data` classes are simple read-only objects. They never contain the token.

### 4.3 GitHub API Calls

| Purpose | Request |
|---|---|
| Verify token | `GET /user` |
| Repository details and access | `GET /repos/{owner}/{repo}` |
| Resolve a ref to a commit | `GET /repos/{owner}/{repo}/commits/{ref}` |
| Download content | `GET /repos/{owner}/{repo}/tarball/{sha}` |

All requests send:

```http
Accept: application/vnd.github+json
Authorization: Bearer {token}
X-GitHub-Api-Version: 2022-11-28
User-Agent: StudentAssignmentReviewAI
```

```php
// app/Services/Git/Providers/GitHubClient.php (excerpt)

private function request(string $token): PendingRequest
{
    return Http::baseUrl(config('git.providers.github.api_base_url'))
        ->withToken($token)
        ->withHeaders([
            'Accept' => 'application/vnd.github+json',
            'X-GitHub-Api-Version' => config('git.providers.github.api_version'),
            'User-Agent' => 'StudentAssignmentReviewAI',
        ])
        ->timeout(config('git.http_timeout_seconds'))
        ->connectTimeout(10);
}

public function resolveCommit(string $token, string $owner, string $name, string $ref): GitCommit
{
    $response = $this->request($token)
        ->get("/repos/{$owner}/{$name}/commits/" . rawurlencode($ref));

    if ($response->status() === 404 || $response->status() === 422) {
        throw new CommitNotFoundException();
    }

    $this->throwForProviderError($response);

    return new GitCommit(
        sha: $response->json('sha'),
        committedAt: $response->json('commit.committer.date'),
    );
}
```

---

## 5. Workflows

### 5.1 Connect a Git Account

```text
User submits token
      |
      v
Validate request (provider, token present)
      |
      v
Call provider: verify token  ──── invalid ───► 422 GIT_CONNECTION_INVALID
      |
      v
Save connection (token encrypted, username, verified_at)
      |
      v
201 Created (token never returned)
```

| ID | Rule |
|---|---|
| `BR-GIT-01` | A user can have multiple connections. |
| `BR-GIT-04` | The token is verified before saving. |
| `GIT-CON-01` | The provider `username` is taken from the verification response, never from the request. |
| `GIT-CON-02` | A user cannot have two active connections to the same provider account. |
| `GIT-CON-03` | Updating a connection's token re-verifies it. |

### 5.2 Register a Repository

```text
User submits repository URL
      |
      v
RepositoryUrlParser: validate and parse  ──── unsafe ───► 422 UNSAFE_REPOSITORY_URL
      |
      v
Provider matches the connection?  ──── no ───► 422 (validation error)
      |
      v
Call provider: get repository  ──── no access ───► 422 REPOSITORY_ACCESS_DENIED
      |
      v
Save repository (canonical URL, owner, name, provider ID, default branch)
      |
      v
201 Created
```

| ID | Rule |
|---|---|
| `BR-GIT-05` | Only HTTPS URLs from allowed hosts are accepted. |
| `BR-GIT-07` | The connection must have access to the repository. |
| `GIT-REP-01` | The stored URL is the canonical form returned by the provider, such as `https://github.com/owner/name`. |
| `GIT-REP-02` | The provider's repository ID is stored, so renamed or moved repositories can still be matched. |
| `GIT-REP-03` | The same repository cannot be registered twice through the same connection. |
| `GIT-REP-04` | Repositories larger than the size limit are rejected at registration with `REPOSITORY_TOO_LARGE`. |

### 5.3 Link Repositories to an Assignment

**Teacher (`TEMPLATE` / `REFERENCE`):** see `BR-ARP-01` to `BR-ARP-04`.

**Student:** see `BR-SRP-01` to `BR-SRP-05`.

Before linking, the system re-checks that the connection still has access to the repository.

### 5.4 Resolve a Commit at Submission

```text
Student submits (repository_id, branch, optional commit_sha)
      |
      v
commit_sha provided?
   ├── yes → resolveCommit(commit_sha) to confirm it exists
   └── no  → resolveCommit(branch) to get the latest commit
      |
      v
Store submission with the exact 40-character SHA
```

| ID | Rule |
|---|---|
| `BR-SUB-05` | Every submission stores an exact commit SHA. |
| `BR-SUB-06` | A commit that does not exist is rejected with `COMMIT_NOT_FOUND`. |
| `GIT-SUB-01` | Branch names are validated (no spaces, no `..`, maximum 255 characters) and URL-encoded in API calls. |
| `GIT-SUB-02` | Commit resolution happens during the submission request, because the student needs immediate feedback if the commit is invalid. |

### 5.5 Retrieve Content for Analysis

Content is retrieved inside the analysis job (see `docs/business/ai-review.md`).

```text
AnalyzeSubmissionJob(analysis_run_id)
      |
      v
Load run → submission → repository → connection
      |
      v
Create isolated workspace directory
      |
      v
Download archive at the submission's commit SHA
      |
      v
Check size, then extract safely
      |
      v
Filter files (section 7)
      |
      v
Pass file list and contents to AI analysis
      |
      v
Delete workspace (always, in finally)
```

**Recommended method: archive download.** The system downloads a `.tar.gz` archive through the provider API instead of running `git clone`. This is the preferred approach because:

- No Git binary or shell command is needed.
- Git hooks, submodules, and Git configuration in the repository are never processed.
- The token is sent in an HTTP header, never placed in a URL or command line.
- Only the files at one commit are downloaded, not the full history.

If `git clone` is ever required (for example, to analyze history), it must follow section 8.4.

---

## 6. URL Validation and SSRF Protection

Repository URLs come from users, so they are treated as untrusted. The server must never be tricked into requesting internal addresses.

### 6.1 Rules

| Check | Rejected Example |
|---|---|
| Must be `https` | `http://github.com/owner/repo` |
| Host must be in the allowlist exactly | `https://github.com.evil.example/owner/repo` |
| No user info or credentials | `https://token@github.com/owner/repo` |
| No port other than the default | `https://github.com:8080/owner/repo` |
| No IP addresses | `https://140.82.112.3/owner/repo` |
| No local or private hosts | `https://localhost/repo`, `https://192.168.1.10/repo` |
| No metadata addresses | `https://169.254.169.254/latest` |
| No query string or fragment | `https://github.com/owner/repo?x=1` |
| Path must be `/{owner}/{name}` with an optional `.git` suffix | `https://github.com/owner/repo/tree/main` |
| Owner and name use only allowed characters | `https://github.com/../etc/passwd` |

### 6.2 Parser Example

```php
// app/Services/Git/RepositoryUrlParser.php

namespace App\Services\Git;

use App\Exceptions\UnsafeRepositoryUrlException;
use App\Services\Git\Data\ParsedRepositoryUrl;

class RepositoryUrlParser
{
    private const NAME_PATTERN = '/^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,99})$/';

    public function parse(string $url): ParsedRepositoryUrl
    {
        $parts = parse_url(trim($url));

        if ($parts === false
            || ($parts['scheme'] ?? null) !== 'https'
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['port'])
            || isset($parts['query'])
            || isset($parts['fragment'])) {
            throw new UnsafeRepositoryUrlException();
        }

        $host = strtolower($parts['host'] ?? '');
        $provider = $this->providerForHost($host);

        if ($provider === null) {
            throw new UnsafeRepositoryUrlException();
        }

        $path = preg_replace('/\.git$/', '', trim($parts['path'] ?? '', '/'));
        $segments = explode('/', $path);

        if (count($segments) !== 2
            || ! preg_match(self::NAME_PATTERN, $segments[0])
            || ! preg_match(self::NAME_PATTERN, $segments[1])
            || in_array('..', $segments, true)) {
            throw new UnsafeRepositoryUrlException();
        }

        return new ParsedRepositoryUrl($provider, $segments[0], $segments[1]);
    }

    private function providerForHost(string $host): ?string
    {
        foreach (config('git.providers') as $name => $provider) {
            if ($provider['enabled'] && $host === $provider['web_host']) {
                return $name;
            }
        }

        return null;
    }
}
```

### 6.3 Requests Go Only to Configured API Hosts

The parsed URL is used **only** to extract the owner and name. All network requests go to the configured `api_base_url` for that provider, never to a host taken from user input. This is the main SSRF protection.

### 6.4 Redirects

- API requests may follow redirects only to hosts belonging to the same provider (for GitHub, archive downloads redirect to `codeload.github.com`).
- Maintain the allowed redirect hosts in configuration, and reject any other redirect target.

---

## 7. Safe Archive Handling

### 7.1 Workspace

| Rule | Detail |
|---|---|
| `GIT-WS-01` | Each analysis run gets its own directory, named by run ID and a random suffix. |
| `GIT-WS-02` | The workspace is outside `public/` and never served over HTTP. |
| `GIT-WS-03` | The workspace is deleted in a `finally` block after every run, success or failure (`BR-ANL-16`). |
| `GIT-WS-04` | A scheduled command removes any workspace older than 1 hour, in case a worker crashed. |

```php
// config/filesystems.php

'git-workspace' => [
    'driver' => 'local',
    'root' => storage_path('app/git-workspace'),
    'visibility' => 'private',
    'throw' => true,
],
```

### 7.2 Download Limits

| Rule | Detail |
|---|---|
| `GIT-DL-01` | The download is streamed to disk, never loaded fully into memory. |
| `GIT-DL-02` | The download stops and fails with `REPOSITORY_TOO_LARGE` if it exceeds the size limit (default 100 MB). |
| `GIT-DL-03` | The download times out after the configured limit (default 120 seconds). |

### 7.3 Extraction Rules

Archives are untrusted. Extraction must prevent files from being written outside the workspace.

| Rule | Protects Against |
|---|---|
| `GIT-EX-01` | Reject entries with absolute paths or `..` segments | Path traversal ("zip slip") |
| `GIT-EX-02` | Do not extract symbolic links or hard links | Links to files outside the workspace |
| `GIT-EX-03` | Do not extract device files, FIFOs, or other special files | Unsafe file types |
| `GIT-EX-04` | Stop if the total extracted size exceeds 3× the size limit | Compression bombs |
| `GIT-EX-05` | Stop if the file count exceeds the limit (default 5,000) | Excessive file counts |
| `GIT-EX-06` | Never set executable permissions on extracted files | Accidental execution |
| `GIT-EX-07` | Remove the top-level folder GitHub adds to archives (`owner-repo-sha/`) | Consistent paths |

After extraction, verify that every file's real path (`realpath()`) starts with the workspace path.

### 7.4 Files Sent to AI Analysis

Not every file in a repository is useful or safe to send to the AI provider.

**Excluded by default:**

| Category | Examples |
|---|---|
| Dependencies | `vendor/`, `node_modules/` |
| Build output | `public/build/`, `dist/`, `build/` |
| Version control | `.git/` |
| Environment and secrets | `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `id_rsa*` |
| Binary files | Images, archives, compiled files, fonts, databases |
| Large files | Any single file over 500 KB (configurable) |
| Lock files | `composer.lock`, `package-lock.json`, `yarn.lock` |

**Rules**

| ID | Rule |
|---|---|
| `GIT-AI-01` | The full file list (paths only) is available for structure rule checks, including excluded paths. |
| `GIT-AI-02` | Only included files have their content sent to the AI provider. |
| `GIT-AI-03` | If a file that looks like a secret (such as `.env`) is found, it is not sent, and a `SECURITY` analysis issue is created advising the student to remove it. |
| `GIT-AI-04` | The teacher can add assignment-specific include or exclude patterns in a future version. |

Structure rules (`BR-STR-*`) are checked against the file list, not the AI, wherever possible.

---

## 8. Security Summary

### 8.1 Tokens

- Encrypted at rest with the `encrypted` cast.
- Sent only in the `Authorization` header to configured provider hosts.
- Never placed in URLs, command lines, logs, exceptions, job payloads, API responses, or AI prompts.
- Added to `dontFlash` and redacted from logged URLs (see `docs/backend/error-handling.md`).

### 8.2 Repository Content

- Treated as untrusted input.
- Never executed: no scripts, hooks, `composer install`, `npm install`, tests, or builds (`BR-ANL-13`, `BR-ANL-14`).
- Stored only temporarily in an isolated workspace and deleted after use (`BR-DAT-06`).

### 8.3 Access

- A repository is accessed only with the token of the connection it was registered through.
- One user's token is never used to access a repository for another user.
- `REFERENCE` repositories are accessed only with the teacher's token and their content is never shown to students (`BR-ARP-03`, `BR-ARP-04`).

### 8.4 If `git clone` Is Ever Used

Only if archive download is not sufficient:

- Run `git` through Symfony `Process` with an argument array, never through a shell string.
- Pass the token through `http.extraHeader`, never in the URL.
- Use `--depth=1`, `--no-tags`, `--single-branch`, and `--no-recurse-submodules`.
- Set `GIT_TERMINAL_PROMPT=0`, `GIT_CONFIG_NOSYSTEM=1`, and `core.hooksPath=/dev/null`.
- Restrict protocols with `protocol.allow=never` and `protocol.https.allow=always`.
- Apply the same timeout, size, and cleanup rules as archive downloads.
- Run in a container or sandbox with no access to application secrets.

---

## 9. Provider Errors

### 9.1 HTTP Response Mapping

| Provider Response | During a User Request | During an Analysis Job |
|---|---|---|
| `401` (bad or expired token) | `422 GIT_CONNECTION_INVALID` | Fail run: `REPOSITORY_ACCESS_REVOKED` (no retry) |
| `403` with rate-limit headers | `503 SERVICE_UNAVAILABLE` | Release job until the reset time (retry) |
| `403` without rate-limit headers | `422 REPOSITORY_ACCESS_DENIED` | Fail run: `REPOSITORY_ACCESS_REVOKED` (no retry) |
| `404` (repository) | `422 REPOSITORY_ACCESS_DENIED` | Fail run: `REPOSITORY_NOT_FOUND` (no retry) |
| `404` / `422` (commit) | `422 COMMIT_NOT_FOUND` | Fail run: `COMMIT_NOT_FOUND` (no retry) |
| `429` | `503 SERVICE_UNAVAILABLE` | Release job with `Retry-After` delay (retry) |
| `5xx` or timeout | `503 SERVICE_UNAVAILABLE` | Retry with backoff, then fail: `REPOSITORY_CLONE_FAILED` |

GitHub returns `404` for private repositories the token cannot access. Treat it as "not found or no access" and do not reveal which.

### 9.2 Connection Health

| ID | Rule |
|---|---|
| `GIT-HLT-01` | When the provider returns `401` for a connection, mark it `token_invalid_at = now()`. |
| `GIT-HLT-02` | The connection resource shows a `status` of `active` or `needs_reauth`, so the user knows to update the token. |
| `GIT-HLT-03` | Updating the token with a valid value clears the invalid status. |
| `GIT-HLT-04` | If the provider reports a token expiry date, store it in `token_expires_at`. |

### 9.3 Rate Limits

- Read `X-RateLimit-Remaining` and `X-RateLimit-Reset` from GitHub responses.
- When remaining requests are low, delay non-urgent work.
- Log rate-limit events at `warning` level with the connection ID, never the token.

---

## 10. Data Model Notes

These fields support the rules above. Confirm them against `docs/database/database.md` and add migrations if needed.

| Table | Field | Purpose |
|---|---|---|
| `git_connections` | `provider` | `github`, `gitlab` |
| `git_connections` | `provider_user_id`, `username` | Account the token belongs to |
| `git_connections` | `access_token` (`TEXT`, encrypted) | Token |
| `git_connections` | `token_verified_at`, `token_invalid_at`, `token_expires_at` | Connection health |
| `repositories` | `provider_repository_id` | Stable provider ID |
| `repositories` | `owner`, `name`, `url` | Canonical identity |
| `repositories` | `default_branch`, `is_private`, `size_kb` | Details from the provider |
| `submissions` | `branch`, `commit_sha` (`CHAR(40)`) | Exact submitted version |
| `analysis_runs` | `commit_sha` (`CHAR(40)`) | Exact analyzed version |

---

## 11. Testing

Follow `docs/backend/testing.md`. Tests never call real Git providers.

### 11.1 Faking the Provider

Bind a fake client, or use `Http::fake()`:

```php
Http::fake([
    'api.github.com/user' => Http::response(['id' => 123, 'login' => 'sreyneang-dev']),
    'api.github.com/repos/sreyneang-dev/laravel-books' => Http::response([
        'id' => 987654,
        'full_name' => 'sreyneang-dev/laravel-books',
        'html_url' => 'https://github.com/sreyneang-dev/laravel-books',
        'default_branch' => 'main',
        'private' => true,
        'size' => 2048,
    ]),
    'api.github.com/repos/sreyneang-dev/laravel-books/commits/main' => Http::response([
        'sha' => str_repeat('a', 40),
    ]),
    'api.github.com/*' => Http::response([], 404),
]);

Http::preventStrayRequests();
```

### 11.2 Required Tests

| Area | Test |
|---|---|
| Connection | Valid token saves the connection; username comes from the provider |
| Connection | Invalid token returns `422 GIT_CONNECTION_INVALID` |
| Connection | Token never appears in any response, log, or job payload |
| Connection | Another user (including an admin) gets `404` |
| URL validation | Every unsafe URL in section 6.1 is rejected |
| URL validation | All requests go to the configured API host, never the user's host |
| Repository | No access returns `422 REPOSITORY_ACCESS_DENIED` |
| Repository | Oversized repository is rejected |
| Submission | Branch resolves to an exact SHA |
| Submission | Unknown commit returns `422 COMMIT_NOT_FOUND` |
| Archive | Entries with `..` or absolute paths are rejected |
| Archive | Symbolic links are not extracted |
| Archive | Size and file-count limits stop extraction |
| Archive | `.env` and `vendor/` content is not sent to the AI |
| Workspace | Workspace is deleted after success and after failure |
| Errors | Each provider response in section 9.1 maps to the correct error or retry |
| Health | A `401` marks the connection as `needs_reauth` |

Build small test archives in the test itself (with `PharData`) to cover malicious archive cases.

---

## 12. Rules for AI Coding Agents

1. All provider calls go through `GitProviderClient`. Do not call provider APIs from Controllers, Models, or Jobs directly.
2. Never build a request URL from a host supplied by the user.
3. Never put a token in a URL, command, log, exception message, job payload, or AI prompt.
4. Use archive download for repository content. Do not add `git clone` unless section 8.4 is followed in full.
5. Never run code, scripts, or package managers on repository content.
6. Always delete the workspace in a `finally` block.
7. Add new error codes to `docs/backend/error-handling.md`.
8. Use `Http::preventStrayRequests()` in tests that touch Git integration.
9. Update this document when a provider, endpoint, or rule changes.

---

## 13. Summary

- GitHub is supported through read-only personal access tokens; GitLab and OAuth are planned.
- Tokens are verified, encrypted, private to their owner, and never exposed.
- Repository URLs are strictly validated; requests go only to configured provider hosts.
- Every submission is pinned to an exact commit SHA.
- Content is retrieved as an archive at that commit, extracted safely, filtered, and deleted after analysis.
- Repository code is never executed.
- Provider errors map to clear error codes, with retries only for temporary failures.
