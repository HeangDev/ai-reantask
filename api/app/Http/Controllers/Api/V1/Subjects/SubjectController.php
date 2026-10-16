<?php

namespace App\Http\Controllers\Api\V1\Subjects;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Subjects\IndexSubjectsRequest;
use App\Http\Requests\Api\V1\Subjects\StoreSubjectRequest;
use App\Http\Requests\Api\V1\Subjects\UpdateSubjectRequest;
use App\Http\Resources\Api\V1\SubjectResource;
use App\Models\Subject;
use App\Services\Subjects\SubjectService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class SubjectController extends Controller
{
    public function __construct(private readonly SubjectService $subjects) {}

    public function index(IndexSubjectsRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Subject::class);

        return SubjectResource::collection(
            $this->subjects->paginate($request->user(), $request->validated())
        );
    }

    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $subject = $this->subjects->create($request->user(), $request->validated());

        return (new SubjectResource($subject))->response()->setStatusCode(201);
    }

    public function show(Subject $subject): SubjectResource
    {
        Gate::authorize('view', $subject);

        return new SubjectResource($subject);
    }

    public function update(UpdateSubjectRequest $request, Subject $subject): SubjectResource
    {
        return new SubjectResource($this->subjects->update($request->user(), $subject, $request->validated()));
    }

    public function destroy(Request $request, Subject $subject): Response
    {
        Gate::authorize('delete', $subject);

        $this->subjects->delete($request->user(), $subject);

        return response()->noContent();
    }
}
