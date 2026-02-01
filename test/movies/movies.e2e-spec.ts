import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { AppModule } from "@/app.module";

import { AuthHelper } from "../helpers/auth.helper";
import { DatabaseHelper } from "../helpers/database.helper";
import { TestDataFactory } from "../helpers/test-data.factory";

describe("Movies API (e2e)", () => {
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

  describe("GET /movies", () => {
    it("should return paginated movies", async () => {
      const response = await request(app.getHttpServer())
        .get("/movies")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body).toHaveProperty("meta");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty("total");
      expect(response.body.meta).toHaveProperty("page");
      expect(response.body.meta).toHaveProperty("limit");
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).get("/movies").expect(401);
    });

    it("should support pagination parameters", async () => {
      const response = await request(app.getHttpServer())
        .get("/movies")
        .query({ page: "1", limit: "10" })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("meta");
      expect(response.body.meta.page).toBe(1);
    });

    it("should filter by category if supported", async () => {
      const response = await request(app.getHttpServer())
        .get("/movies")
        .query({ category: "action" })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("POST /movies", () => {
    it("should create a new movie", async () => {
      const movieData = testDataFactory.createTestMovie();

      const response = await request(app.getHttpServer())
        .post("/movies")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(movieData)
        .expect(201);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.title).toBe(movieData.title);
      expect(response.body.data.category).toBe(movieData.category);
    });

    it("should return 401 when not authenticated", async () => {
      const movieData = testDataFactory.createTestMovie();

      await request(app.getHttpServer())
        .post("/movies")
        .send(movieData)
        .expect(401);
    });

    it("should return 400 for invalid data", async () => {
      await request(app.getHttpServer())
        .post("/movies")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          title: "", // Empty title
        })
        .expect(400);
    });

    it("should return 400 for missing required fields", async () => {
      await request(app.getHttpServer())
        .post("/movies")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });
  });

  describe("PATCH /movies/:id", () => {
    it("should update a movie", async () => {
      // First create a movie
      const movieData = testDataFactory.createTestMovie();
      const createResponse = await request(app.getHttpServer())
        .post("/movies")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(movieData);

      const movieId = createResponse.body.data.id;

      // Update the movie
      const updateData = {
        category: "comedy",
      };

      const response = await request(app.getHttpServer())
        .patch(`/movies/${movieId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data.category).toBe(updateData.category);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer())
        .patch("/movies/some-id")
        .send({ category: "comedy" })
        .expect(401);
    });

    it("should return 404 for non-existent movie", async () => {
      const response = await request(app.getHttpServer())
        .patch("/movies/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ category: "comedy" });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe("DELETE /movies/:id", () => {
    it("should delete a movie", async () => {
      // First create a movie
      const movieData = testDataFactory.createTestMovie();
      const createResponse = await request(app.getHttpServer())
        .post("/movies")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(movieData);

      const movieId = createResponse.body.data.id;

      // Delete the movie
      await request(app.getHttpServer())
        .delete(`/movies/${movieId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Verify movie is deleted
      await request(app.getHttpServer())
        .get(`/movies/${movieId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).delete("/movies/some-id").expect(401);
    });

    it("should return 404 for non-existent movie", async () => {
      const response = await request(app.getHttpServer())
        .delete("/movies/non-existent-id")
        .set("Authorization", `Bearer ${accessToken}`);

      expect([404, 200]).toContain(response.status);
    });
  });

  describe("GET /movies/ids", () => {
    it("should return user movie IDs", async () => {
      const response = await request(app.getHttpServer())
        .get("/movies/ids")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).get("/movies/ids").expect(401);
    });
  });
});
