import { ActivityType } from '../enums/activityType';
import { SubscriptionActionType, SubscriptionObjectType } from '../enums/subscriptions';

export interface SubscriptionActivityUpdate {
  title: string
  type: ActivityType
  private: boolean
}

export interface SubscriptionAppDeauthorization {
  authorized: boolean
}

export interface SubscriptionEvent {
  object_type: SubscriptionObjectType
  object_id: number
  aspect_type: SubscriptionActionType
  updates: SubscriptionActivityUpdate | SubscriptionAppDeauthorization
  owner_id: number
  subscription_id: number
  event_time: number
}
