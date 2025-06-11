// Performance monitoring utility for the Discord music bot
class PerformanceMonitor {
    constructor() {
        this.startTime = Date.now();
        this.metrics = {
            memoryPeaks: [],
            cpuUsage: [],
            connectionEvents: [],
            errorCounts: {}
        };
        this.isMonitoring = false;
    }

    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('[Performance Monitor] 📊 Starting performance monitoring...');
        
        // Monitor memory usage every 30 seconds
        this.memoryInterval = setInterval(() => {
            const memory = process.memoryUsage();
            this.metrics.memoryPeaks.push({
                timestamp: Date.now(),
                heapUsed: memory.heapUsed,
                heapTotal: memory.heapTotal,
                rss: memory.rss,
                external: memory.external
            });
            
            // Keep only last 100 measurements (50 minutes of data)
            if (this.metrics.memoryPeaks.length > 100) {
                this.metrics.memoryPeaks.shift();
            }
            
            // Log warning if memory usage is high
            const memoryMB = memory.heapUsed / 1024 / 1024;
            if (memoryMB > 200) {
                console.warn(`[Performance Monitor] ⚠️ High memory usage: ${memoryMB.toFixed(1)}MB`);
            }
        }, 30000);

        // Monitor CPU usage every 60 seconds
        this.cpuInterval = setInterval(() => {
            const cpuUsage = process.cpuUsage();
            this.metrics.cpuUsage.push({
                timestamp: Date.now(),
                user: cpuUsage.user,
                system: cpuUsage.system
            });
            
            // Keep only last 60 measurements (1 hour of data)
            if (this.metrics.cpuUsage.length > 60) {
                this.metrics.cpuUsage.shift();
            }
        }, 60000);
    }

    stop() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        console.log('[Performance Monitor] 📊 Stopping performance monitoring...');
        
        if (this.memoryInterval) clearInterval(this.memoryInterval);
        if (this.cpuInterval) clearInterval(this.cpuInterval);
    }

    logConnectionEvent(type, guildId) {
        this.metrics.connectionEvents.push({
            timestamp: Date.now(),
            type: type, // 'connect', 'disconnect', 'error'
            guildId: guildId
        });
        
        // Keep only last 200 events
        if (this.metrics.connectionEvents.length > 200) {
            this.metrics.connectionEvents.shift();
        }
    }

    logError(errorType, error) {
        if (!this.metrics.errorCounts[errorType]) {
            this.metrics.errorCounts[errorType] = 0;
        }
        this.metrics.errorCounts[errorType]++;
        
        console.error(`[Performance Monitor] ❌ Error logged: ${errorType}`, error.message);
    }

    getMemoryStats() {
        if (this.metrics.memoryPeaks.length === 0) return null;
        
        const latest = this.metrics.memoryPeaks[this.metrics.memoryPeaks.length - 1];
        const peak = this.metrics.memoryPeaks.reduce((max, current) => 
            current.heapUsed > max.heapUsed ? current : max
        );
        
        return {
            current: latest,
            peak: peak,
            average: this.metrics.memoryPeaks.reduce((sum, m) => sum + m.heapUsed, 0) / this.metrics.memoryPeaks.length
        };
    }

    getConnectionStats() {
        const now = Date.now();
        const lastHour = now - (60 * 60 * 1000);
        
        const recentEvents = this.metrics.connectionEvents.filter(e => e.timestamp > lastHour);
        
        return {
            totalEvents: this.metrics.connectionEvents.length,
            lastHourEvents: recentEvents.length,
            connects: recentEvents.filter(e => e.type === 'connect').length,
            disconnects: recentEvents.filter(e => e.type === 'disconnect').length,
            errors: recentEvents.filter(e => e.type === 'error').length
        };
    }

    getErrorStats() {
        return { ...this.metrics.errorCounts };
    }

    getUptime() {
        return Date.now() - this.startTime;
    }

    generateReport() {
        const memoryStats = this.getMemoryStats();
        const connectionStats = this.getConnectionStats();
        const errorStats = this.getErrorStats();
        const uptime = this.getUptime();
        
        return {
            uptime: uptime,
            memory: memoryStats,
            connections: connectionStats,
            errors: errorStats,
            isMonitoring: this.isMonitoring,
            dataPoints: {
                memory: this.metrics.memoryPeaks.length,
                cpu: this.metrics.cpuUsage.length,
                connections: this.metrics.connectionEvents.length
            }
        };
    }

    // Auto-cleanup method to prevent memory leaks
    cleanup() {
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        
        // Clean old memory data (keep last hour)
        this.metrics.memoryPeaks = this.metrics.memoryPeaks.filter(m => m.timestamp > oneHourAgo);
        
        // Clean old CPU data (keep last hour)
        this.metrics.cpuUsage = this.metrics.cpuUsage.filter(c => c.timestamp > oneHourAgo);
        
        // Clean old connection events (keep last 2 hours)
        const twoHoursAgo = now - (2 * 60 * 60 * 1000);
        this.metrics.connectionEvents = this.metrics.connectionEvents.filter(e => e.timestamp > twoHoursAgo);
        
        console.log('[Performance Monitor] 🧹 Cleaned old performance data');
    }

    // Method to check if performance is degraded
    isPerformanceDegraded() {
        const memoryStats = this.getMemoryStats();
        if (!memoryStats) return false;
        
        const currentMemoryMB = memoryStats.current.heapUsed / 1024 / 1024;
        const connectionStats = this.getConnectionStats();
        
        return {
            highMemory: currentMemoryMB > 250,
            memoryLeak: memoryStats.peak.heapUsed > memoryStats.average * 1.5,
            connectionIssues: connectionStats.errors > connectionStats.connects * 0.1,
            degraded: currentMemoryMB > 250 || connectionStats.errors > 5
        };
    }
}

module.exports = PerformanceMonitor;
