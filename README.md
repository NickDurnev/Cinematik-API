<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Task Manager REST API

This repository contains the source code for the Task Manager REST API project. It is built with Node.js, NestJS, TypeORM, PostgreSQL and other dependencies listed in `package.json`.
The API is used to access and manipulate data related to tasks and users. It consists of several endpoints that allow you to perform CRUD operations on tasks and authenticate users.

## Technologies Used

- NestJS
- TypeORM
- PostgreSQL
- Jimp
- Bcrypt
- Passport-JWT
- Joi
- Resend (Email Service)

## Features

### Authentication
- User registration and login
- Social login (Google, Facebook, etc.)
- JWT token-based authentication
- Password reset functionality
- Email notifications using Resend

### Password Reset Flow
1. User requests password reset by providing email
2. System generates a secure reset token (valid for 1 hour)
3. User receives a beautiful HTML email with reset link
4. User clicks the link and enters new password
5. System validates token and updates password
6. Token is marked as used and cannot be reused

## Installation

```bash
$ npm install
```

## Environment Variables

Make sure to set up the following environment variables, check env.example

## Running MacOS Postgres DB locally 

```bash
$ brew services start postgresql@14
```

Create DB 

```bash
$ createdb cinematik_api
```

List DB's

```bash
$ psql -l
```

Check connection 

```bash
$ psql -d cinematik_api -c "\dt"
```

If you got "Did not find any relations", you successfully connected ✅

## Migrations 

Generate SQL migrations file using Drizzle-Kit

```bash
$ npx drizzle-kit generate
```

Apply generated SQL migration files

```bash
$ npx drizzle-kit migrate
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `POST /auth/social` - Social login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset email
- `POST /auth/reset-password` - Reset password using token

### Password Reset Example

1. Request password reset:
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

2. Check email for reset link and use it to reset password:
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "newPassword": "NewStrongPass123!"
  }'
```

## Email Templates

The application includes beautiful, responsive HTML email templates for:
- Password reset emails with secure tokens
- Professional branding with Cinematik theme
- Mobile-responsive design
- Security warnings and expiry notices

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
