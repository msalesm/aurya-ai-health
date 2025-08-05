import { useState, useEffect, useCallback } from 'react';
import { 
  LocalNotifications, 
  LocalNotificationSchema,
  PendingLocalNotificationSchema 
} from '@capacitor/local-notifications';
import { 
  PushNotifications, 
  PushNotificationSchema, 
  ActionPerformed 
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

interface NotificationPermissions {
  local: boolean;
  push: boolean;
}

export const useNotifications = () => {
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    local: false,
    push: false,
  });
  const [isNative] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    if (!isNative) return;

    const initializeNotifications = async () => {
      // Request permissions
      const localPermission = await LocalNotifications.requestPermissions();
      const pushPermission = await PushNotifications.requestPermissions();

      setPermissions({
        local: localPermission.display === 'granted',
        push: pushPermission.receive === 'granted',
      });

      // Register for push notifications
      if (pushPermission.receive === 'granted') {
        await PushNotifications.register();
      }
    };

    initializeNotifications();

    // Add listeners
    let registrationListener: any;
    let registrationErrorListener: any;
    let pushListener: any;
    let actionListener: any;

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
    }).then(listener => { registrationListener = listener; });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Registration error: ', err.error);
    }).then(listener => { registrationErrorListener = listener; });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ', notification);
    }).then(listener => { pushListener = listener; });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
    }).then(listener => { actionListener = listener; });

    return () => {
      if (registrationListener) registrationListener.remove();
      if (registrationErrorListener) registrationErrorListener.remove();
      if (pushListener) pushListener.remove();
      if (actionListener) actionListener.remove();
    };
  }, [isNative]);

  const scheduleLocalNotification = useCallback(async (
    title: string,
    body: string,
    scheduleAt?: Date
  ): Promise<boolean> => {
    if (!isNative || !permissions.local) return false;

    try {
      const notificationId = Date.now();
      const notification: LocalNotificationSchema = {
        id: notificationId,
        title,
        body,
        schedule: scheduleAt ? { at: scheduleAt } : undefined,
        sound: 'beep.wav',
        attachments: undefined,
        actionTypeId: '',
        extra: null,
      };

      await LocalNotifications.schedule({
        notifications: [notification],
      });

      return true;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return false;
    }
  }, [isNative, permissions.local]);

  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    if (!isNative) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        const ids = pending.notifications.map((n: PendingLocalNotificationSchema) => n.id);
        await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
      }
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }, [isNative]);

  const scheduleHealthReminder = useCallback(async (
    message: string,
    hours: number
  ): Promise<boolean> => {
    const scheduleTime = new Date();
    scheduleTime.setHours(scheduleTime.getHours() + hours);

    return await scheduleLocalNotification(
      'Lembrete de Saúde - Triia',
      message,
      scheduleTime
    );
  }, [scheduleLocalNotification]);

  return {
    permissions,
    isNative,
    scheduleLocalNotification,
    scheduleHealthReminder,
    cancelAllNotifications,
  };
};