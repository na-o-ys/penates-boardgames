import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DayScreen } from "@/components/day/DayScreen";
import { dayNormalState, dayRobberSwapState, dayReceivedBreadState, dayReceivedNoticeState } from "./mocks/gameState";

const success = async () => ({ success: true as const });

const meta = {
  title: "Screens/DayScreen",
  component: DayScreen,
  parameters: { layout: "fullscreen" },
  args: {
    onAdvancePhase: fn(success),
  },
} satisfies Meta<typeof DayScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: dayNormalState,
  },
};

export const RobberSwap: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: dayRobberSwapState,
  },
};

export const ReceivedBread: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: dayReceivedBreadState,
  },
};

export const ReceivedNotice: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: dayReceivedNoticeState,
  },
};
