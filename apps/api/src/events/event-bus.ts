import { EventEmitter } from "events";
import logger from "../utils/logger";
import { transactionContextStorage } from "../utils/context";

class EventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit of listeners if many modules subscribe to the same event
    this.setMaxListeners(50);
  }

  publish(eventName: string, data: any) {
    const txContext = transactionContextStorage.getStore();
    if (txContext && txContext.inTransaction) {
      logger.debug(`[EventBus] Queueing event inside transaction: ${eventName}`);
      txContext.pendingEvents.push({ eventName, data });
    } else {
      logger.debug(`[EventBus] Publishing event: ${eventName}`, { payload: data });
      this.emit(eventName, data);
    }
  }

  subscribe(eventName: string, listener: (data: any) => void) {
    logger.debug(`[EventBus] Registering listener for event: ${eventName}`);
    this.on(eventName, listener);
  }
}

export const eventBus = new EventBus();
export default eventBus;
