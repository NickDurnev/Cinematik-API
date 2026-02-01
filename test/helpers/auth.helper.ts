import { INestApplication } from "@nestjs/common";
import * as request from "supertest";

export class AuthHelper {
  constructor(private readonly app: INestApplication) {}

  async signUp(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ accessToken: string; user: any }> {
    const response = await request(this.app.getHttpServer())
      .post("/auth/signup")
      .send(userData)
      .expect(201);

    return {
      accessToken: response.body.data.tokens.access_token,
      user: response.body.data.user,
    };
  }

  async signIn(email: string, password: string): Promise<string> {
    const response = await request(this.app.getHttpServer())
      .post("/auth/signin")
      .send({ email, password })
      .expect(200);

    return response.body.data.tokens.access_token;
  }

  async getAccessToken(email: string, password: string): Promise<string> {
    return this.signIn(email, password);
  }

  async getAuthenticatedUser(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ accessToken: string; user: any }> {
    // Sign up the user
    const { accessToken, user } = await this.signUp(userData);

    return { accessToken, user };
  }
}
