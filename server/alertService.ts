import { storage } from './storage';
import type { InsertTrapEvent, AlertRule } from '@shared/schema';

/**
 * Alert Service - Evaluates alert rules and sends notifications
 */

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
}

/**
 * Send notification via Telegram Bot API
 */
async function sendTelegramNotification(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('⚠️  Telegram credentials not configured (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)');
    return false;
  }

  try {
    const telegramMessage: TelegramMessage = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    };

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramMessage),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Telegram API error:', error);
      return false;
    }

    console.log('✅ Telegram notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error);
    return false;
  }
}

/**
 * Format trap event into a readable message
 */
function formatTrapEventMessage(event: InsertTrapEvent, trapTypeName: string): string {
  const eventTime = event.blockTimestamp || new Date();
  const timestamp = new Date(eventTime).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  // Truncate addresses for readability
  const shortAddress = `${event.contractAddress.slice(0, 6)}...${event.contractAddress.slice(-4)}`;
  const shortTx = `${event.txHash.slice(0, 8)}...${event.txHash.slice(-6)}`;

  return `🚨 *Trap Event Detected*

*Type:* ${trapTypeName}
*Contract:* \`${shortAddress}\`
*Chain ID:* ${event.chainId}
*Severity:* ${event.severity || 'medium'}
*Time:* ${timestamp} UTC

*Transaction:* \`${shortTx}\`
*Block:* ${event.blockNumber}

[View on Explorer](https://hoodi.etherscan.io/tx/${event.txHash})`;
}

/**
 * Check if alert rule should trigger based on event
 */
function shouldTriggerAlert(rule: AlertRule, event: InsertTrapEvent): boolean {
  if (!rule.isActive) return false;

  const conditions = rule.conditions as Record<string, any>;

  // Trigger type: frequency (always trigger for now - can add rate limiting later)
  if (rule.triggerType === 'frequency') {
    return true;
  }

  // Trigger type: condition (check severity, chainId, etc.)
  if (rule.triggerType === 'condition') {
    if (conditions.severity && event.severity !== conditions.severity) {
      return false;
    }
    if (conditions.chainId && event.chainId !== conditions.chainId) {
      return false;
    }
    return true;
  }

  // Trigger type: status_change (trap status changed)
  if (rule.triggerType === 'status_change') {
    return true;
  }

  // Default: don't trigger
  return false;
}

/**
 * Process alert rules for a trap event
 */
export async function processAlertRules(event: InsertTrapEvent, trapTypeName: string): Promise<void> {
  try {
    // Get all active alert rules
    const rules = await storage.getAllAlertRules();
    const activeRules = rules.filter(r => r.isActive);

    if (activeRules.length === 0) {
      return; // No active rules to process
    }

    // Check each rule
    for (const rule of activeRules) {
      if (shouldTriggerAlert(rule, event)) {
        const actions = rule.actions as string[];
        
        // Send notifications based on configured actions
        if (actions.includes('telegram')) {
          const message = formatTrapEventMessage(event, trapTypeName);
          await sendTelegramNotification(message);
          
          // Log delivery (optional - can store in alert_deliveries table)
          console.log(`📤 Alert triggered: ${rule.name} -> telegram`);
        }

        // Future: Add Discord, Email, Webhook support
        if (actions.includes('discord')) {
          console.log(`📤 Discord notification (not implemented yet): ${rule.name}`);
        }
        if (actions.includes('email')) {
          console.log(`📤 Email notification (not implemented yet): ${rule.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error processing alert rules:', error);
  }
}
