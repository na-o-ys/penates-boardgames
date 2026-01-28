import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { VotingScreen } from "@/components/voting/VotingScreen";
import { votingNotVotedState, votingVotedState, votingRobberNotVotedState } from "./mocks/gameState";

const success = async () => ({ success: true as const });

const meta = {
  title: "Screens/VotingScreen",
  component: VotingScreen,
  parameters: { layout: "fullscreen" },
  args: {
    onSubmitVote: fn(success),
    onAutoVote: fn(success),
  },
} satisfies Meta<typeof VotingScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotVoted: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: votingNotVotedState,
  },
};

export const Voted: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: votingVotedState,
  },
};

export const RobberNotVoted: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: votingRobberNotVotedState,
  },
};
