import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Clock, Calendar } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

export const NotificationManager: React.FC = () => {
  const { permissions, scheduleHealthReminder, cancelAllNotifications, isNative } = useNotifications();
  const [reminderText, setReminderText] = useState('');
  const [hoursFromNow, setHoursFromNow] = useState('24');

  const handleScheduleReminder = async () => {
    if (!reminderText.trim()) {
      toast.error('Digite uma mensagem para o lembrete');
      return;
    }

    const hours = parseInt(hoursFromNow);
    if (isNaN(hours) || hours < 1) {
      toast.error('Digite um número válido de horas');
      return;
    }

    const success = await scheduleHealthReminder(reminderText, hours);
    
    if (success) {
      toast.success(`Lembrete agendado para ${hours} horas`);
      setReminderText('');
    } else {
      toast.error('Falha ao agendar lembrete');
    }
  };

  const handleCancelAll = async () => {
    await cancelAllNotifications();
    toast.success('Todos os lembretes foram cancelados');
  };

  if (!isNative) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notificações disponíveis apenas em dispositivos móveis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Gerenciador de Notificações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permissions Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status das Permissões</Label>
          <div className="flex gap-2">
            <Badge variant={permissions.local ? 'default' : 'destructive'}>
              {permissions.local ? (
                <>
                  <Bell className="h-3 w-3 mr-1" />
                  Local Ativada
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3 mr-1" />
                  Local Negada
                </>
              )}
            </Badge>
            <Badge variant={permissions.push ? 'default' : 'destructive'}>
              {permissions.push ? (
                <>
                  <Bell className="h-3 w-3 mr-1" />
                  Push Ativada
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3 mr-1" />
                  Push Negada
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Schedule Health Reminder */}
        {permissions.local && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Agendar Lembrete de Saúde</Label>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="reminder-text" className="text-xs">Mensagem do Lembrete</Label>
                <Input
                  id="reminder-text"
                  placeholder="Ex: Hora de tomar o medicamento"
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="hours-from-now" className="text-xs">Horas a partir de agora</Label>
                <Input
                  id="hours-from-now"
                  type="number"
                  min="1"
                  placeholder="24"
                  value={hoursFromNow}
                  onChange={(e) => setHoursFromNow(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleScheduleReminder}
                  className="flex-1 flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Agendar
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCancelAll}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Cancelar Todos
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Lembretes Rápidos</Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReminderText('Verificar sinais vitais');
                setHoursFromNow('8');
              }}
              disabled={!permissions.local}
            >
              Check-up (8h)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReminderText('Beber água e se hidratar');
                setHoursFromNow('2');
              }}
              disabled={!permissions.local}
            >
              Hidratação (2h)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};