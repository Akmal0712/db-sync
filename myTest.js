async function consumeAndSendBatch() {
  const batchSize = 1000;
  const maxWaitTimeMs = 1000;
  const messageBatch = [];

  let startTime = Date.now();

  while (true) {
    const message = await consumeMessage();

    if (message) {
      messageBatch.push(message);

      if (messageBatch.length >= batchSize) {
        await sendBatch(messageBatch);
        messageBatch.length = 0; // Clear the batch
        startTime = Date.now(); // Reset the start time
      }
    }

    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= maxWaitTimeMs) {
      if (messageBatch.length > 0) {
        await sendBatch(messageBatch);
        messageBatch.length = 0; // Clear the batch
      }

      startTime = Date.now(); // Reset the start time
    }
  }
}
