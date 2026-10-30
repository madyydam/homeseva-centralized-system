export interface CoworkingMemberItem {
  id: string;
  memberCode: string;
  name: string;
  company: string;
  phone: string;
  planType: 'Hot Desk' | 'Dedicated Desk' | 'Private 6-Pax Cabin' | 'Virtual Office Prime';
  monthlyFee: number;
  startDate: string;
  status: 'Active Member' | 'Payment Pending' | 'Notice Period';
}

export interface MeetingRoomBookingItem {
  id: string;
  roomName: 'Boardroom Odyssey (12 Pax)' | 'Conference Nexus (8 Pax)' | 'Brainstorm Pod A (4 Pax)';
  bookedBy: string;
  date: string;
  timeSlot: string;
  creditsUsed: number;
  status: 'Confirmed' | 'In-Use' | 'Completed';
}

export interface DayPassItem {
  id: string;
  visitorName: string;
  phone: string;
  deskAssigned: string;
  amount: number;
  passDate: string;
  accessStatus: 'Checked-In' | 'Completed';
}

export interface HsCoworkingData {
  members: CoworkingMemberItem[];
  roomBookings: MeetingRoomBookingItem[];
  dayPasses: DayPassItem[];
}

