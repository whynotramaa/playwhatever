import React, { HTMLAttributes, forwardRef, ReactNode } from "react";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "panel" | "flat";
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "panel", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          variant === "flat" ? "panel panel-flat" : "panel",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

/**
 * A game on the shelf. DESIGN.md section 8: artwork, title, one sentence, then
 * players and what the game asks of them, with an arrow for the action.
 *
 * The artwork is the card's one tinted block, so the shell stays on surface
 * tokens. Six cards each printed on their own accent would put six accents on
 * screen at once, which section 3 does not allow.
 */
export interface GameCardProps extends HTMLAttributes<HTMLButtonElement> {
  title: string;
  description: string;
  playerCount: string;
  genre: string;
  artwork?: string;
}

export const GameCard = forwardRef<HTMLButtonElement, GameCardProps>(
  ({ title, description, playerCount, genre, artwork, className, ...props }, ref) => {
    return (
      <button ref={ref} type="button" className={clsx("game-card", className)} {...props}>
        <span className="game-card-art" aria-hidden="true">
          {artwork ? (
            <img src={artwork} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          ) : null}
        </span>
        <span className="game-card-sheet">
          <span className="card-title">{title}</span>
          <span className="desc">{description}</span>
          <span className="meta">
            <span>{playerCount}</span>
            <span className="sep">·</span>
            <span>{genre}</span>
            <ArrowRight className="arrow" aria-hidden="true" />
          </span>
        </span>
      </button>
    );
  }
);

GameCard.displayName = "GameCard";
