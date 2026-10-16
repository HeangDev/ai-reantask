<?php

namespace App\Http\Controllers\Api\V1\Classes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Classes\IndexClassesRequest;
use App\Http\Requests\Api\V1\Classes\StoreClassRequest;
use App\Http\Requests\Api\V1\Classes\UpdateClassRequest;
use App\Http\Resources\Api\V1\SchoolClassResource;
use App\Models\SchoolClass;
use App\Services\Classes\ClassService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ClassController extends Controller
{
    public function __construct(private readonly ClassService $classes) {}

    public function index(IndexClassesRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', SchoolClass::class);

        return SchoolClassResource::collection(
            $this->classes->paginate($request->user(), $request->validated())
        );
    }

    public function store(StoreClassRequest $request): JsonResponse
    {
        $class = $this->classes->create($request->user(), $request->validated());

        return (new SchoolClassResource($class))->response()->setStatusCode(201);
    }

    public function show(SchoolClass $schoolClass): SchoolClassResource
    {
        Gate::authorize('view', $schoolClass);

        return new SchoolClassResource($schoolClass);
    }

    public function update(UpdateClassRequest $request, SchoolClass $schoolClass): SchoolClassResource
    {
        return new SchoolClassResource($this->classes->update($request->user(), $schoolClass, $request->validated()));
    }

    public function destroy(Request $request, SchoolClass $schoolClass): Response
    {
        Gate::authorize('delete', $schoolClass);

        $this->classes->delete($request->user(), $schoolClass);

        return response()->noContent();
    }
}
