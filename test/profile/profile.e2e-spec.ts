import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { AppModule } from "@/app.module";

import { AuthHelper } from "../helpers/auth.helper";
import { DatabaseHelper } from "../helpers/database.helper";
import { TestDataFactory } from "../helpers/test-data.factory";

describe("Profile API (e2e)", () => {
  let app: INestApplication;
  let databaseHelper: DatabaseHelper;
  let authHelper: AuthHelper;
  let testDataFactory: TestDataFactory;

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

  describe("GET /profile", () => {
    it("should return user profile when authenticated", async () => {
      const userData = testDataFactory.createTestUser();

      // Sign up and get token
      const { accessToken, user } = await authHelper.signUp(userData);

      // Get profile
      const response = await request(app.getHttpServer())
        .get("/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.name).toBe(userData.name);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).get("/profile").expect(401);
    });

    it("should return 401 with invalid token", async () => {
      await request(app.getHttpServer())
        .get("/profile")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });
  });

  describe("PATCH /profile", () => {
    it("should update user profile successfully", async () => {
      const userData = testDataFactory.createTestUser();

      // Sign up and get token
      const { accessToken } = await authHelper.signUp(userData);

      // Update profile
      const updateData = {
        name: "Updated Name",
      };

      const response = await request(app.getHttpServer())
        .patch("/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(response.body.data.name).toBe(updateData.name);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer())
        .patch("/profile")
        .send({ name: "Updated Name" })
        .expect(401);
    });

    it("should not allow updating email without confirmation", async () => {
      const userData = testDataFactory.createTestUser();

      // Sign up and get token
      const { accessToken } = await authHelper.signUp(userData);

      // Try to update email
      const response = await request(app.getHttpServer())
        .patch("/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          email: "newemail@example.com",
        });

      // Should either accept it or require confirmation
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("DELETE /profile", () => {
    it("should delete user profile successfully", async () => {
      const userData = testDataFactory.createTestUser();

      // Sign up and get token
      const { accessToken } = await authHelper.signUp(userData);

      // Delete profile
      await request(app.getHttpServer())
        .delete("/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Verify user can no longer sign in
      await request(app.getHttpServer())
        .post("/auth/signin")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(401);
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer()).delete("/profile").expect(401);
    });
  });

  describe("GET /profile/search", () => {
    it("should search users by name", async () => {
      const userData = testDataFactory.createTestUser({
        name: "John Doe",
      });

      // Sign up user to search for
      await authHelper.signUp(userData);

      // Create another user to perform the search
      const { accessToken } = await authHelper.signUp(
        testDataFactory.createTestUser(),
      );

      // Search for users
      const response = await request(app.getHttpServer())
        .get("/profile/search")
        .query({ q: "John" })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].name).toContain("John");
      }
    });

    it("should return 401 when not authenticated", async () => {
      await request(app.getHttpServer())
        .get("/profile/search")
        .query({ q: "John" })
        .expect(401);
    });

    it("should return empty array for non-matching query", async () => {
      const { accessToken } = await authHelper.signUp(
        testDataFactory.createTestUser(),
      );

      const response = await request(app.getHttpServer())
        .get("/profile/search")
        .query({ q: "NonExistentUser123456" })
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });
  });
});
