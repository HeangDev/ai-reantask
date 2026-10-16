<?php

namespace Database\Factories;

use App\Enums\SubjectStatus;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subject>
 */
class SubjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->sentence(),
            'status' => SubjectStatus::Active,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => SubjectStatus::Inactive]);
    }
}
