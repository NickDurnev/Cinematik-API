import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
class OptionalAuthGuard extends AuthGuard("jwt") {
  handleRequest(err, user, info, context: ExecutionContext) {
    // If user is not authenticated, just return null instead of throwing
    return user || null;
  }
}

export default OptionalAuthGuard;
