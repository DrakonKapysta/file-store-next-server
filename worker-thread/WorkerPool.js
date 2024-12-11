const { Worker } = require("worker_threads");

class WorkerPool {
  constructor(workerFile, poolSize, workerData) {
    this.poolSize = poolSize;
    this.workerFile = workerFile;
    this.idleWorkers = [];

    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerFile, { workerData });
      this.idleWorkers.push(worker);
    }
  }
  async execute(task) {
    return new Promise((resolve, reject) => {
      if (this.idleWorkers.length === 0) {
        reject(new Error("No idle workers available"));
        return;
      }

      const worker = this.idleWorkers.pop();
      worker.once("message", (result) => {
        this.idleWorkers.push(worker);
        resolve(result);
      });

      worker.once("error", (error) => {
        this.idleWorkers.push(worker);
        reject(error);
      });

      worker.postMessage(task);
    });
  }
}

module.exports = WorkerPool;
