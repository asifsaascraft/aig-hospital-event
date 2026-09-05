import Event from "../models/Event.js";

/**
 * Generate the next registration number for an event.
 *
 * IMPORTANT:
 * This function MUST be called inside a MongoDB transaction.
 *
 * @param {ObjectId|string} eventId
 * @param {mongoose.ClientSession} session
 * @returns {Promise<string>}
 */
export const generateRegistrationNumber = async (eventId, session) => {
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
    },
    {
      $inc: {
        regCounter: 1,
      },
    },
    {
      new: true,
      session,
    },
  );

  if (!updatedEvent) {
    throw new Error("Unable to update event registration counter");
  }

  if (!updatedEvent.eventCode) {
    throw new Error("Event code is not configured");
  }

  return `${updatedEvent.eventCode}-${updatedEvent.regCounter}`;
};