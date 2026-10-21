package com.reantask.api.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

class ClassCodeGeneratorTest {

    private final ClassCodeGenerator generator = new ClassCodeGenerator();

    @Test
    void generate_returnsSixUppercaseAlphanumericCharacters() {
        IntStream.range(0, 200).forEach(i -> assertThat(generator.generate()).matches("^[A-Z0-9]{6}$"));
    }

    @Test
    void generate_variesBetweenCalls() {
        long distinct = IntStream.range(0, 50).mapToObj(i -> generator.generate()).distinct().count();

        assertThat(distinct).isGreaterThan(40);
    }
}
