import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { ResponseInterceptor } from "@/utils/response/response.interceptor";

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
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());

  SwaggerModule.setup("api", app, document);

  const PORT = process.env.PORT;
  await app.listen(PORT);
  logger.log(`Application is running on port ${PORT}`);
}
bootstrap();
