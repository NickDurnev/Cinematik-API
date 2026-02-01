import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { ResponseInterceptor } from "@/utils/response/response.interceptor";
import ResponseExceptionFilter from "@/utils/response/response-exception.filter";

import { AppModule } from "./app.module";
import { TransformInterceptor } from "./transform.interceptor";

async function bootstrap() {
  const logger = new Logger();

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Cinematik API")
    .setDescription("The Cinematik API description")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Authentication")
    .addTag("Reviews")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://cinematik-git-dev-nickdurnevs-projects.vercel.app",
    ],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ResponseExceptionFilter());

  SwaggerModule.setup("api", app, document);

  const PORT = process.env.PORT;
  await app.listen(PORT);
  logger.log(`Application is running on port ${PORT}`);
}
bootstrap();
