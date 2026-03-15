import { Module } from "@nestjs/common";
import { MailProcessor } from "./mail.processor";
import {MailService} from "./mail.service"
import { QueueModule } from "../bull/queue.module";

@Module({
    imports: [QueueModule],
    providers: [MailProcessor, MailService],
    exports: [MailService]
})
export class MailModule {}