import React, { ReactNode } from "react";
import { Ticket } from "lucide-react";

/**
 * The room invitation, drawn as a physical ticket. Presentational only: the
 * caller owns the share and copy actions and passes them in as `action`.
 */
export function InvitationTicket({
  gameName,
  hostName,
  roomCode,
  playerCount,
  maxPlayers,
  status,
  action,
}: {
  gameName: string;
  hostName: string;
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  status?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ticket">
      <div className="ticket-body">
        <div className="ticket-inner">
          <div className="brand flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" />
            <span>Room Invitation</span>
          </div>
          <h3 className="card-title text-2xl font-normal">{gameName}</h3>
          <p className="line text-sm">
            Host: {hostName}
            {status ? ` · ${status}` : ""}
          </p>
          <div className="rows text-xs">
            <div>
              <span>Players</span>
              <span className="leader" />
              <b>
                {playerCount} / {maxPlayers}
              </b>
            </div>
            <div>
              <span>Ticket</span>
              <span className="leader" />
              <b>#{roomCode}</b>
            </div>
          </div>
        </div>
      </div>
      <div className="ticket-stub">
        <span className="brand text-[11px]">Room Code</span>
        <span className="room-code text-xl font-bold font-mono select-all">{roomCode}</span>
        {action}
      </div>
    </div>
  );
}
