export class TestDataFactory {
  private static counter = 0;

  private static generateId(): string {
    return `test_${Date.now()}_${this.counter++}`;
  }

  private static randomEmail(): string {
    return `test_${this.generateId()}@example.com`;
  }

  private static randomName(): string {
    const id = this.counter++;
    return `User${id}`;
  }

  createTestUser(
    overrides?: Partial<{
      name: string;
      email: string;
      password: string;
    }>,
  ): {
    name: string;
    email: string;
    password: string;
    picture: string;
  } {
    return {
      name: overrides?.name || this.randomName(),
      email: overrides?.email || this.randomEmail(),
      password: overrides?.password || "Password123!",
      picture: "https://example.com/avatar.jpg",
    };
  }

  createTestMovie(
    overrides?: Partial<{
      title: string;
      category: string;
    }>,
  ): {
    title: string;
    category: string;
  } {
    return {
      title: overrides?.title || `Test Movie ${this.generateId()}`,
      category: overrides?.category || "action",
    };
  }

  createTestReview(
    overrides?: Partial<{
      movieId: string;
      rating: number;
      comment: string;
    }>,
  ): {
    movieId: string;
    rating: number;
    comment: string;
  } {
    return {
      movieId: overrides?.movieId || this.generateId(),
      rating: overrides?.rating || 8,
      comment: overrides?.comment || "Great movie!",
    };
  }

  generateId(): string {
    return TestDataFactory.generateId();
  }

  randomEmail(): string {
    return TestDataFactory.randomEmail();
  }

  randomName(): string {
    return TestDataFactory.randomName();
  }
}
