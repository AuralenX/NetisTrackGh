class MaintenanceScheduler {
  /**
   * Calculate next maintenance date based on generator hours
   */
  static calculateNextMaintenance(currentHours, lastMaintenanceHours, maintenanceInterval) {
    const hoursSinceLastMaintenance = currentHours - lastMaintenanceHours;
    const hoursUntilNextMaintenance = maintenanceInterval - hoursSinceLastMaintenance;
    
    return {
      hoursSinceLastMaintenance,
      hoursUntilNextMaintenance,
      isOverdue: hoursSinceLastMaintenance > maintenanceInterval,
      nextMaintenanceHours: lastMaintenanceHours + maintenanceInterval
    };
  }

  /**
   * Generate maintenance schedule for all sites
   */
  static generateMaintenanceSchedule(sites) {
    const schedule = [];
    
    sites.forEach(site => {
      if (!site.generator || !site.maintenanceSchedule) return;
      
      const maintenanceInfo = this.calculateNextMaintenance(
        site.generator.currentRunHours || 0,
        site.generator.lastMaintenanceHours || 0,
        site.maintenanceSchedule.maintenanceInterval
      );

      if (maintenanceInfo.isOverdue || maintenanceInfo.hoursUntilNextMaintenance < 50) {
        schedule.push({
          siteId: site.id,
          siteName: site.name,
          maintenanceType: 'preventive',
          title: `Preventive Maintenance - ${site.name}`,
          description: `Generator preventive maintenance due after ${maintenanceInfo.hoursSinceLastMaintenance} run hours`,
          priority: maintenanceInfo.isOverdue ? 'high' : 'medium',
          estimatedHours: 4,
          currentRunHours: site.generator.currentRunHours,
          hoursUntilMaintenance: maintenanceInfo.hoursUntilNextMaintenance,
          isOverdue: maintenanceInfo.isOverdue
        });
      }
    });

    return schedule.sort((a, b) => a.hoursUntilMaintenance - b.hoursUntilMaintenance);
  }

  /**
   * Calculate maintenance cost trends
   */
  static calculateMaintenanceCostTrends(maintenanceLogs) {
    const monthlyCosts = {};
    
    maintenanceLogs.forEach(log => {
      if (log.completedDate && log.totalCost) {
        const month = new Date(log.completedDate).toISOString().substring(0, 7); // YYYY-MM
        
        if (!monthlyCosts[month]) {
          monthlyCosts[month] = {
            totalCost: 0,
            count: 0,
            averageCost: 0
          };
        }
        
        monthlyCosts[month].totalCost += log.totalCost;
        monthlyCosts[month].count += 1;
        monthlyCosts[month].averageCost = monthlyCosts[month].totalCost / monthlyCosts[month].count;
      }
    });

    return monthlyCosts;
  }
}

module.exports = MaintenanceScheduler;