import { SQSHandler, SQSEvent } from "aws-lambda";
import { SQSListenerController } from "../controllers/fleet-emission-queue.controller";

export const handler: SQSHandler = async (event: SQSEvent) => {
  const sqsListenerController = new SQSListenerController();
  await sqsListenerController.handle(event);
};
