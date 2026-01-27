import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import { lobbyHostState, lobbyGuestState } from "./mocks/gameState";

const success = async () => ({ success: true as const });

const meta = {
  title: "Screens/LobbyScreen",
  component: LobbyScreen,
  parameters: { layout: "fullscreen" },
  args: {
    onStartGame: fn(success),
    onSetRoles: fn(success),
    onUpdateConfig: fn(success),
    onKickPlayer: fn(success),
  },
} satisfies Meta<typeof LobbyScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Host: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: lobbyHostState,
  },
};

export const Guest: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p2",
    gameState: lobbyGuestState,
  },
};
