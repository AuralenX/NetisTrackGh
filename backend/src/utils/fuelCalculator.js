class FuelCalculator {
  /**
   * Calculate fuel consumption rate
   */
  static calculateConsumptionRate(fuelLogs) {
    if (fuelLogs.length < 2) return 0;

    let totalFuel = 0;
    let totalHours = 0;

    for (let i = 1; i < fuelLogs.length; i++) {
      const current = fuelLogs[i];
      const previous = fuelLogs[i - 1];

      if (current.generatorHours && previous.generatorHours) {
        const hoursDiff = current.generatorHours - previous.generatorHours;
        const fuelDiff = previous.currentLevel - current.previousLevel;

        if (hoursDiff > 0 && fuelDiff > 0) {
          totalFuel += fuelDiff;
          totalHours += hoursDiff;
        }
      }
    }

    return totalHours > 0 ? (totalFuel / totalHours) : 0;
  }

  /**
   * Calculate remaining runtime
   */
  static calculateRemainingRuntime(currentFuelLevel, consumptionRate, tankCapacity) {
    if (consumptionRate <= 0) return 0;

    const availableFuel = (currentFuelLevel / 100) * tankCapacity;
    return availableFuel / consumptionRate;
  }

  /**
   * Detect fuel theft anomalies
   */
  static detectFuelTheft(fuelLogs, threshold = 0.3) {
    const anomalies = [];
    const consumptionRate = this.calculateConsumptionRate(fuelLogs);

    for (let i = 1; i < fuelLogs.length; i++) {
      const current = fuelLogs[i];
      const previous = fuelLogs[i - 1];

      if (current.generatorHours && previous.generatorHours) {
        const expectedConsumption = consumptionRate * (current.generatorHours - previous.generatorHours);
        const actualConsumption = previous.currentLevel - current.previousLevel;

        if (actualConsumption > expectedConsumption * (1 + threshold)) {
          anomalies.push({
            logId: current.id,
            date: current.refuelDate,
            expectedConsumption,
            actualConsumption,
            discrepancy: actualConsumption - expectedConsumption
          });
        }
      }
    }

    return anomalies;
  }
}

module.exports = FuelCalculator;