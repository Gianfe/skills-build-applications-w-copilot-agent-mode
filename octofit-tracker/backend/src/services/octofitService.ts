import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid activity input'), { status: 400 });
  if (!_input || typeof _input !== 'object' || Array.isArray(_input)) throw invalidInput();

  const input = _input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string' ||
    !/^[a-f\d]{24}$/i.test(userId) ||
    typeof teamId !== 'string' ||
    !/^[a-f\d]{24}$/i.test(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw invalidInput();
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) throw invalidInput();

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

export async function createTeam(_input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid team input'), { status: 400 });
  if (!_input || typeof _input !== 'object' || Array.isArray(_input)) throw invalidInput();

  const input = _input as Record<string, unknown>;
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !/^[a-f\d]{24}$/i.test(member))
  ) {
    throw invalidInput();
  }

  const memberUsers = await Promise.all(members.map((member) => User.findById(member).select('_id')));
  const memberIds = memberUsers.map((member) => {
    if (!member) throw invalidInput();
    return member._id;
  });

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } })
    .select('_id name')
    .lean();
  const teamNames = new Map(teams.map(({ _id, name }) => [_id.toString(), name]));

  return totals
    .flatMap(({ _id, totalPoints }) => {
      const teamName = teamNames.get(_id.toString());
      return teamName === undefined ? [] : [{ teamName, totalPoints }];
    })
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('_id fitnessGoal').lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const recentActivity = activities[0]?.type;
  const focus = user.fitnessGoal.toLowerCase();

  return workouts
    .sort((left, right) => {
      const leftMatches = left.focus.toLowerCase() === focus ? 1 : 0;
      const rightMatches = right.focus.toLowerCase() === focus ? 1 : 0;
      return rightMatches - leftMatches || (left.title ?? '').localeCompare(right.title ?? '');
    })
    .map((workout) => ({
      ...workout,
      reason: `Recommended for your ${focus} goal${recentActivity ? ` and recent ${recentActivity} activity` : ''}.`,
    }));
}

export { User };
