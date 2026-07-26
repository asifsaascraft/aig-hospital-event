const generateTicketNumber = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ticketNumber = "TK";

  for (let i = 0; i < 6; i++) {
    ticketNumber += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return ticketNumber;
};

export default generateTicketNumber;