// Notification service for real-time updates and alerts

export interface NotificationConfig {
  enabled: boolean;
  priceAlerts: boolean;
  transactionAlerts: boolean;
  portfolioAlerts: boolean;
  sound: boolean;
  desktop: boolean;
  email?: string;
}

export interface PriceAlert {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  chain: string;
  type: 'above' | 'below' | 'change';
  value: number;
  currentPrice?: number;
  triggered: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export interface Notification {
  id: string;
  type: 'price' | 'transaction' | 'portfolio' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

class NotificationService {
  private config: NotificationConfig;
  private alerts: PriceAlert[] = [];
  private notifications: Notification[] = [];
  private listeners: ((notification: Notification) => void)[] = [];
  private priceListeners: ((alert: PriceAlert) => void)[] = [];

  constructor() {
    this.config = this.loadConfig();
    if (typeof window !== 'undefined') {
      this.requestPermission();
    }
  }

  // Load notification configuration from localStorage
  private loadConfig(): NotificationConfig {
    if (typeof window === 'undefined') {
      return {
        enabled: true,
        priceAlerts: true,
        transactionAlerts: true,
        portfolioAlerts: true,
        sound: true,
        desktop: true,
      };
    }

    try {
      const saved = localStorage.getItem('notification-config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load notification config:', error);
    }

    return {
      enabled: true,
      priceAlerts: true,
      transactionAlerts: true,
      portfolioAlerts: true,
      sound: true,
      desktop: true,
    };
  }

  // Save notification configuration to localStorage
  private saveConfig(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('notification-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save notification config:', error);
    }
  }

  // Request desktop notification permission
  private async requestPermission(): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window && this.config.desktop) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
  }

  // Update notification configuration
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  // Get current configuration
  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Add price alert
  addPriceAlert(alert: Omit<PriceAlert, 'id' | 'triggered' | 'createdAt'>): string {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggered: false,
      createdAt: Date.now(),
    };

    this.alerts.push(newAlert);
    this.saveAlerts();
    return newAlert.id;
  }

  // Remove price alert
  removePriceAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.saveAlerts();
  }

  // Get all price alerts
  getPriceAlerts(): PriceAlert[] {
    return [...this.alerts];
  }

  // Check price alerts against current prices
  checkPriceAlerts(prices: { [tokenAddress: string]: { price: number; change24h: number } }): void {
    if (!this.config.enabled || !this.config.priceAlerts) return;

    this.alerts.forEach(alert => {
      if (alert.triggered) return;

      const priceData = prices[alert.tokenAddress];
      if (!priceData) return;

      let shouldTrigger = false;
      let message = '';

      switch (alert.type) {
        case 'above':
          if (priceData.price >= alert.value) {
            shouldTrigger = true;
            message = `${alert.tokenSymbol} price is now $${priceData.price.toFixed(4)}, above your alert threshold of $${alert.value}`;
          }
          break;
        case 'below':
          if (priceData.price <= alert.value) {
            shouldTrigger = true;
            message = `${alert.tokenSymbol} price is now $${priceData.price.toFixed(4)}, below your alert threshold of $${alert.value}`;
          }
          break;
        case 'change':
          if (Math.abs(priceData.change24h) >= alert.value) {
            shouldTrigger = true;
            const direction = priceData.change24h > 0 ? 'increased' : 'decreased';
            message = `${alert.tokenSymbol} price has ${direction} by ${Math.abs(priceData.change24h).toFixed(2)}% in 24h`;
          }
          break;
      }

      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = Date.now();
        alert.currentPrice = priceData.price;

        this.sendNotification({
          type: 'price',
          title: 'Price Alert Triggered',
          message,
          data: alert,
          priority: 'high',
        });

        // Notify price alert listeners
        this.priceListeners.forEach(listener => listener(alert));
      }
    });

    this.saveAlerts();
  }

  // Send notification
  sendNotification(notification: Omit<Notification, 'id' | 'read' | 'timestamp'>): void {
    if (!this.config.enabled) return;

    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      timestamp: Date.now(),
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();

    // Send desktop notification
    if (typeof window !== 'undefined' && this.config.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/favicon.ico',
        tag: newNotification.id,
      });
    }

    // Play sound
    if (this.config.sound) {
      this.playNotificationSound();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(newNotification));
  }

  // Play notification sound
  private playNotificationSound(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (error) {
      // Ignore audio errors
    }
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  // Clear all notifications
  clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // Get unread notification count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Subscribe to notifications
  subscribe(listener: (notification: Notification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Subscribe to price alerts
  subscribeToPriceAlerts(listener: (alert: PriceAlert) => void): () => void {
    this.priceListeners.push(listener);
    return () => {
      this.priceListeners = this.priceListeners.filter(l => l !== listener);
    };
  }

  // Save alerts to localStorage
  private saveAlerts(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('price-alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save price alerts:', error);
    }
  }

  // Load alerts from localStorage
  private loadAlerts(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('price-alerts');
      if (saved) {
        this.alerts = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load price alerts:', error);
    }
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  // Load notifications from localStorage
  private loadNotifications(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  // Initialize service
  init(): void {
    this.loadAlerts();
    this.loadNotifications();
  }

  // Send transaction notification
  sendTransactionNotification(type: 'confirmed' | 'failed' | 'pending', txHash: string, chain: string): void {
    if (!this.config.transactionAlerts) return;

    const messages = {
      confirmed: 'Transaction confirmed successfully',
      failed: 'Transaction failed',
      pending: 'Transaction submitted and pending',
    };

    this.sendNotification({
      type: 'transaction',
      title: `Transaction ${type}`,
      message: `${messages[type]} on ${chain}`,
      data: { txHash, chain },
      priority: type === 'failed' ? 'high' : 'medium',
    });
  }

  // Send portfolio notification
  sendPortfolioNotification(message: string, data?: any): void {
    if (!this.config.portfolioAlerts) return;

    this.sendNotification({
      type: 'portfolio',
      title: 'Portfolio Update',
      message,
      data,
      priority: 'low',
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Initialize on client side only
if (typeof window !== 'undefined') {
  notificationService.init();
}