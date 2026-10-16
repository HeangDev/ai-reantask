<?php

namespace Database\Factories;

use App\Enums\ClassStatus;
use App\Models\SchoolClass;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<SchoolClass>
 */
class SchoolClassFactory extends Factory
{
    protected $model = SchoolClass::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'code' => Str::upper(Str::random(6)),
            'description' => fake()->sentence(),
            'status' => ClassStatus::Active,
            'start_at' => now()->toDateString(),
            'end_date' => now()->addMonths(6)->toDateString(),
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => ClassStatus::Inactive]);
    }
}
