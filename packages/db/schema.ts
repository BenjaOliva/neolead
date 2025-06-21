import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  varchar,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const teamTierEnum = pgEnum("team_tier", ["basic", "pro"]);
export const teamPrivacyEnum = pgEnum("team_privacy", [
  "private",
  "public",
  "public_admin_confirm",
]);
export const teamFeedPermissionEnum = pgEnum("team_feed_permission", [
  "members_and_trainers",
  "trainers_only",
]);
export const memberRoleEnum = pgEnum("member_role", [
  "member",
  "trainer",
  "admin",
]);
export const assignmentStatusEnum = pgEnum("assignment_status", [
  "active",
  "completed",
  "overdue",
  "paused",
]);
export const assignmentTypeEnum = pgEnum("assignment_type", [
  "one_time",
  "periodic",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "training_assigned",
  "training_completed",
  "goal_reached",
  "team_invitation",
  "team_post",
  "assignment_overdue",
  "information",
  "reminder",
  "marketing",
]);
export const postTypeEnum = pgEnum("post_type", [
  "text",
  "poll",
  "training",
  "event",
  "announcement",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Teams table
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  tier: teamTierEnum("tier").default("basic").notNull(),
  privacy: teamPrivacyEnum("privacy").default("private").notNull(),
  feedPermission: teamFeedPermissionEnum("feed_permission")
    .default("members_and_trainers")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Team members table (junction table for users and teams)
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  teamId: uuid("team_id")
    .references(() => teams.id, { onDelete: "cascade" })
    .notNull(),
  role: memberRoleEnum("role").default("member").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Training types/categories
export const trainingTypes = pgTable("training_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Individual training sessions
export const trainings = pgTable("trainings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  trainingTypeId: uuid("training_type_id").references(() => trainingTypes.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  duration: integer("duration"), // in minutes
  intensity: integer("intensity"), // 1-10 scale
  notes: text("notes"),
  data: jsonb("data"), // flexible data for different training types (reps, sets, distance, etc.)
  isPrivate: boolean("is_private").default(true).notNull(),
  completedAt: timestamp("completed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Training plans (templates that can be assigned)
export const trainingPlans = pgTable("training_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdBy: uuid("created_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  goals: jsonb("goals"), // flexible goals structure
  estimatedDuration: integer("estimated_duration"), // in days
  difficulty: integer("difficulty"), // 1-10 scale
  isTemplate: boolean("is_template").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Training plan items (individual exercises/activities in a plan)
export const trainingPlanItems = pgTable("training_plan_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => trainingPlans.id, { onDelete: "cascade" })
    .notNull(),
  trainingTypeId: uuid("training_type_id").references(() => trainingTypes.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  targetData: jsonb("target_data"), // target reps, sets, duration, etc.
  dayOffset: integer("day_offset").default(0).notNull(), // days from plan start
});

// Training plan assignments
export const trainingAssignments = pgTable("training_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => trainingPlans.id, { onDelete: "cascade" })
    .notNull(),
  assignedTo: uuid("assigned_to")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  assignedBy: uuid("assigned_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
  type: assignmentTypeEnum("type").default("one_time").notNull(),
  status: assignmentStatusEnum("status").default("active").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  periodicConfig: jsonb("periodic_config"), // for periodic assignments (frequency, end conditions)
  progress: jsonb("progress"), // track completion progress
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Training shares (when users share private trainings with teams)
export const trainingShares = pgTable("training_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainingId: uuid("training_id")
    .references(() => trainings.id, { onDelete: "cascade" })
    .notNull(),
  teamId: uuid("team_id")
    .references(() => teams.id, { onDelete: "cascade" })
    .notNull(),
  sharedBy: uuid("shared_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
});

// Team feed posts
export const teamPosts = pgTable("team_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .references(() => teams.id, { onDelete: "cascade" })
    .notNull(),
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: postTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }),
  content: text("content"),
  data: jsonb("data"), // flexible data for different post types
  trainingId: uuid("training_id").references(() => trainings.id), // if sharing a training
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Poll options (for poll posts)
export const pollOptions = pgTable("poll_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .references(() => teamPosts.id, { onDelete: "cascade" })
    .notNull(),
  text: varchar("text", { length: 200 }).notNull(),
  votes: integer("votes").default(0).notNull(),
});

// Poll votes
export const pollVotes = pgTable("poll_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  optionId: uuid("option_id")
    .references(() => pollOptions.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  votedAt: timestamp("voted_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // additional data related to the notification
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team invitations
export const teamInvitations = pgTable("team_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .references(() => teams.id, { onDelete: "cascade" })
    .notNull(),
  invitedBy: uuid("invited_by")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: memberRoleEnum("role").default("member").notNull(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  trainings: many(trainings),
  createdPlans: many(trainingPlans),
  receivedAssignments: many(trainingAssignments, {
    relationName: "assignedTo",
  }),
  givenAssignments: many(trainingAssignments, { relationName: "assignedBy" }),
  notifications: many(notifications),
  posts: many(teamPosts),
  pollVotes: many(pollVotes),
  trainingShares: many(trainingShares),
  sentInvitations: many(teamInvitations),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  plans: many(trainingPlans),
  assignments: many(trainingAssignments),
  posts: many(teamPosts),
  invitations: many(teamInvitations),
  trainingShares: many(trainingShares),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const trainingsRelations = relations(trainings, ({ one, many }) => ({
  user: one(users, {
    fields: [trainings.userId],
    references: [users.id],
  }),
  trainingType: one(trainingTypes, {
    fields: [trainings.trainingTypeId],
    references: [trainingTypes.id],
  }),
  shares: many(trainingShares),
}));

export const trainingPlansRelations = relations(
  trainingPlans,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [trainingPlans.createdBy],
      references: [users.id],
    }),
    team: one(teams, {
      fields: [trainingPlans.teamId],
      references: [teams.id],
    }),
    items: many(trainingPlanItems),
    assignments: many(trainingAssignments),
  }),
);

export const trainingPlanItemsRelations = relations(
  trainingPlanItems,
  ({ one }) => ({
    plan: one(trainingPlans, {
      fields: [trainingPlanItems.planId],
      references: [trainingPlans.id],
    }),
    trainingType: one(trainingTypes, {
      fields: [trainingPlanItems.trainingTypeId],
      references: [trainingTypes.id],
    }),
  }),
);

export const trainingAssignmentsRelations = relations(
  trainingAssignments,
  ({ one }) => ({
    plan: one(trainingPlans, {
      fields: [trainingAssignments.planId],
      references: [trainingPlans.id],
    }),
    assignedToUser: one(users, {
      fields: [trainingAssignments.assignedTo],
      references: [users.id],
      relationName: "assignedTo",
    }),
    assignedByUser: one(users, {
      fields: [trainingAssignments.assignedBy],
      references: [users.id],
      relationName: "assignedBy",
    }),
    team: one(teams, {
      fields: [trainingAssignments.teamId],
      references: [teams.id],
    }),
  }),
);

export const teamPostsRelations = relations(teamPosts, ({ one, many }) => ({
  team: one(teams, {
    fields: [teamPosts.teamId],
    references: [teams.id],
  }),
  author: one(users, {
    fields: [teamPosts.authorId],
    references: [users.id],
  }),
  training: one(trainings, {
    fields: [teamPosts.trainingId],
    references: [trainings.id],
  }),
  pollOptions: many(pollOptions),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  post: one(teamPosts, {
    fields: [pollOptions.postId],
    references: [teamPosts.id],
  }),
  votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  option: one(pollOptions, {
    fields: [pollVotes.optionId],
    references: [pollOptions.id],
  }),
  user: one(users, {
    fields: [pollVotes.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const teamInvitationsRelations = relations(
  teamInvitations,
  ({ one }) => ({
    team: one(teams, {
      fields: [teamInvitations.teamId],
      references: [teams.id],
    }),
    inviter: one(users, {
      fields: [teamInvitations.invitedBy],
      references: [users.id],
    }),
  }),
);

export const trainingSharesRelations = relations(trainingShares, ({ one }) => ({
  training: one(trainings, {
    fields: [trainingShares.trainingId],
    references: [trainings.id],
  }),
  team: one(teams, {
    fields: [trainingShares.teamId],
    references: [teams.id],
  }),
  sharedBy: one(users, {
    fields: [trainingShares.sharedBy],
    references: [users.id],
  }),
}));

export const trainingTypesRelations = relations(
  trainingTypes,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [trainingTypes.createdBy],
      references: [users.id],
    }),
    trainings: many(trainings),
    planItems: many(trainingPlanItems),
  }),
);
