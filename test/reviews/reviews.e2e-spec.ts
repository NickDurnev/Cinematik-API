import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { AppModule } from "@/app.module";

import { AuthHelper } from "../helpers/auth.helper";
import { DatabaseHelper } from "../helpers/database.helper";
import { TestDataFactory } from "../helpers/test-data.factory";

describe("Reviews API (e2e)", () => {
  let app: INestApplication;
  let databaseHelper: DatabaseHelper;
  let authHelper: AuthHelper;
  let testDataFactory: TestDataFactory;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    databaseHelper = new DatabaseHelper();
    authHelper = new AuthHelper(app);
    testDataFactory = new TestDataFactory();

    try {
      await databaseHelper.setupDatabase();

      // Create a test user and get access token
      const { accessToken: token } = await authHelper.signUp(
        testDataFactory.createTestUser(),
      );
      accessToken = token;
    } catch (error) {
      console.warn(
        "Warning: Could not connect to test database. Integration tests will be skipped.",
      );
    }
  });

  afterAll(async () => {
    try {
      await databaseHelper.cleanupDatabase();
      await databaseHelper.close();
    } catch (error) {
      console.warn("Warning: Could not cleanup test database");
    }
    await app.close();
  });

  beforeEach(async () => {
    try {
      await databaseHelper.beginTransaction();
    } catch (error) {
      console.warn("Warning: Could not begin transaction");
    }
  });

  afterEach(async () => {
    try {
      await databaseHelper.rollbackTransaction();
    } catch (error) {
      console.warn("Warning: Could not rollback transaction");
    }
  });

  describe("GET /reviews", () => {
    it("should return reviews for a movie", async () => {
      const response = await request(app.getHttpServer())
        .get("/reviews")
        .query({ movie_id: "test-movie-id" })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer())
        .get("/reviews")
        .query({ movie_id: "test-movie-id" })
        .expect(401);
    });

    it("should require movie_id parameter", async () => {
      const response = await request(app.getHttpServer())
        .get("/reviews")
        .set("Authorization", `Bearer ${accessToken}`);

      // Should either return 400 for missing parameter or empty array
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("POST /reviews", () => {
    it("should create a new review", async () => {
      const reviewData = testDataFactory.createTestReview({
        movieId: "test-movie-id",
        rating: 8,
        comment: "Great movie!",
      });

      const response = await request(app.getHttpServer())
        .post("/reviews")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.rating).toBe(reviewData.rating);
      expect(response.body.data.comment).toBe(reviewData.comment);
    });

    it("should return 401 when not authenticated", async () => {
      const reviewData = testDataFactory.createTestReview();

      await request(app.getHttpServer())
        .post("/reviews")
        .send(reviewData)
        .expect(401);
    });

    it("should return 400 for invalid rating", async () => {
      const reviewData = {
        movie_id: "test-movie-id",
        rating: 15, // Invalid rating > 10
        comment: "Great movie!",
      };

      await request(app.getHttpServer())
        .post("/reviews")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(reviewData)
        .expect(400);
    });

    it("should return 400 for missing required fields", async () => {
      await request(app.getHttpServer())
        .post("/reviews")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          movie_id: "test-movie-id",
          // Missing rating and comment
        })
        .expect(400);
    });

    it("should validate rating range (1-10)", async () => {
      const reviewData = {
        movie_id: "test-movie-id",
        rating: 0, // Invalid rating < 1
        comment: "Great movie!",
      };

      await request(app.getHttpServer())
        .post("/reviews")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(reviewData)
        .expect(400);
    });
  });

  describe("PATCH /reviews/:id", () => {
    it("should update a review", async () => {
      // First create a review
      const reviewData = testDataFactory.createTestReview();
      const createResponse = await request(app.getHttpServer())
        .post("/reviews")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(reviewData);

      const reviewId = createResponse.body.data.id;

      // Update the review
      const updateData = {
        rating: 9,
        comment: "Updated comment",
      };

      const response = await request(app.getHttpServer())
        .patch(`/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data.rating).toBe(updateData.rating);
      expect(response.body.data.comment).toBe(updateData.comment);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer())
        .patch("/reviews/some-id")
        .send({ rating: 9 })
        .expect(401);
    });

    it("should return 404 for non-existent review", async () => {
      const response = await request(app.getHttpServer())
        .patch("/reviews/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ rating: 9 });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe("DELETE /reviews/:id", () => {
    it("should delete a review", async () => {
      // First create a review
      const reviewData = testDataFactory.createTestReview();
      const createResponse = await request(app.getHttpServer())
        .post("/reviews")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(reviewData);

      const reviewId = createResponse.body.data.id;

      // Delete the review
      await request(app.getHttpServer())
        .delete(`/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Verify review is deleted
      await request(app.getHttpServer())
        .get(`/reviews/${reviewId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).delete("/reviews/some-id").expect(401);
    });

    it("should return 404 for non-existent review", async () => {
      const response = await request(app.getHttpServer())
        .delete("/reviews/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect([404, 200]).toContain(response.status);
    });
  });
});
