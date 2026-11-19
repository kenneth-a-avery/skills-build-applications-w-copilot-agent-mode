import { Activity, Team, User, Workout } from '../models/index.js';
import { isValidObjectId } from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    typeof teamId !== 'string' ||
    !isValidObjectId(userId) ||
    !isValidObjectId(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Activity requires valid userId, teamId, type, and minutes'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.findById(userId).select('_id'), Team.findById(teamId).select('_id')]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof mascot !== 'string' ||
    mascot.trim().length === 0
  ) {
    throw Object.assign(new Error('Team requires a name and mascot'), { status: 400 });
  }

  if (members !== undefined && (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !isValidObjectId(member)))) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }

  const memberIds = (members ?? []) as string[];
  if (memberIds.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: memberIds } });
    if (memberCount !== new Set(memberIds).size) {
      throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
    }
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: unknown; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1 } },
  ]);

  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).select('_id name').lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals
    .map(({ _id, totalPoints }, index) => ({
      teamName: names.get(String(_id)),
      totalPoints,
      rank: index + 1,
    }))
    .filter((entry): entry is { teamName: string; totalPoints: number; rank: number } => entry.teamName !== undefined);
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('_id fitnessGoal').lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [recentActivity] = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).select('type').lean();
  const preferredFocus = user.fitnessGoal || recentActivity?.type;
  const workouts = preferredFocus
    ? await Workout.find({ focus: preferredFocus }).sort({ title: 1 }).lean()
    : [];
  const fallbackWorkouts = workouts.length > 0 ? workouts : await Workout.find().sort({ title: 1 }).lean();
  const reason = user.fitnessGoal
    ? `Recommended to support your ${user.fitnessGoal} goal and recent activity.`
    : recentActivity
      ? `Recommended because of your recent ${recentActivity.type} activity.`
      : 'Recommended based on the available workout options.';

  return fallbackWorkouts.map((workout) => ({ ...workout, reason }));
}

export { User };
