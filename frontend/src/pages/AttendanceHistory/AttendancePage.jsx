import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { checkIn, checkOut, getMyAttendance, getMySummary } from '../../api/attendance';

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatClock(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const STATUS_STYLE = {
  present: { colors: 'bg-primary/20 border-primary/30', indicator: 'bg-primary', label: 'Present' },
  half_day: { colors: 'bg-tertiary-container/20 border-tertiary-container/30', indicator: 'bg-tertiary', label: 'Half Day' },
  absent: { colors: 'bg-error/20 border-error/30', indicator: 'bg-error', label: 'Absent' },
  leave: { colors: 'bg-secondary/20 border-secondary/30', indicator: 'bg-secondary', label: 'Leave' },
};

export default function AttendancePage() {
  const [liveTime, setLiveTime] = useState(new Date());
  const [offset, setOffset] = useState(251.2);
  const cardRef = useRef(null);

  const [monthDate, setMonthDate] = useState(() => new Date());
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [todayRecord, setTodayRecord] = useState(null);
  const [clockError, setClockError] = useState('');
  const [isClockBusy, setIsClockBusy] = useState(false);

  const todayStr = useMemo(() => toDateStr(new Date()), []);

  // Real-time clock update for the shift timer
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Decorative stroke-dashoffset animation on the shift ring
  useEffect(() => {
    const offsetTimer = setInterval(() => {
      setOffset((prev) => {
        const next = prev - 0.1;
        return next < 0 ? 251.2 : next;
      });
    }, 1000);
    return () => clearInterval(offsetTimer);
  }, []);

  const timeString = liveTime.toTimeString().split(' ')[0];

  // Today's own attendance row, independent of whichever month is being browsed above.
  useEffect(() => {
    let cancelled = false;
    getMyAttendance(todayStr, todayStr)
      .then((rows) => {
        if (!cancelled) setTodayRecord(rows[0] || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [todayStr]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError('');
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const dateFrom = toDateStr(new Date(year, month, 1));
      const dateTo = toDateStr(new Date(year, month + 1, 0));
      try {
        const [recs, summ] = await Promise.all([getMyAttendance(dateFrom, dateTo), getMySummary(dateFrom, dateTo)]);
        if (!cancelled) {
          setRecords(recs);
          setSummary(summ);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Could not load attendance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [monthDate]);

  const handleClockAction = useCallback(async () => {
    setClockError('');
    setIsClockBusy(true);
    try {
      if (!todayRecord?.check_in_time) {
        const updated = await checkIn();
        setTodayRecord(updated);
      } else if (!todayRecord?.check_out_time) {
        const updated = await checkOut();
        setTodayRecord(updated);
      }
    } catch (err) {
      setClockError(err.message || 'That action could not be completed');
    } finally {
      setIsClockBusy(false);
    }
  }, [todayRecord]);

  // Mouse tilt effect for shift card
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    } else {
      card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
    }
  };

  const recordsByDate = useMemo(() => {
    const map = {};
    for (const r of records) map[r.date] = r;
    return map;
  }, [records]);

  const calendarDays = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateStr(new Date(year, month, day));
      const record = recordsByDate[dateStr];
      const log = record?.check_in_time
        ? `${formatClock(record.check_in_time)} - ${record.check_out_time ? formatClock(record.check_out_time) : 'Active'}`
        : 'N/A';
      days.push({ day, status: record?.status || null, log, isToday: dateStr === todayStr });
    }
    return days;
  }, [monthDate, recordsByDate, todayStr]);

  // Monday-first blank lead-in cells for the 1st of the month.
  const leadingBlanks = useMemo(() => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
    return (firstDay + 6) % 7;
  }, [monthDate]);

  const monthLabel = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const goPrevMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const presentDays = (summary?.present || 0) + (summary?.half_day || 0);
  const totalTrackedDays = (summary?.present || 0) + (summary?.absent || 0) + (summary?.half_day || 0) + (summary?.leave || 0);
  const attendanceRate = totalTrackedDays ? Math.round((presentDays / totalTrackedDays) * 100) : 0;

  const isCheckedIn = !!todayRecord?.check_in_time;
  const isCheckedOut = !!todayRecord?.check_out_time;
  const elapsedMs = isCheckedIn
    ? (isCheckedOut ? new Date(todayRecord.check_out_time) : liveTime) - new Date(todayRecord.check_in_time)
    : 0;

  return (
    <DashboardLayout userRole="employee" maxWidth="1280px">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-fade-in">
        <div>
          <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">Attendance</h2>
          <p className="text-on-surface-variant mt-1 font-body-md text-body-md">Track your daily cycle and organizational health.</p>
        </div>

        {/* Glass Segmented Control */}
        <div className="flex bg-surface-container-lowest/40 backdrop-blur-md p-1 rounded-xl border border-white/5">
          <button className="px-6 py-2 font-label-sm text-label-sm rounded-lg text-on-surface-variant hover:text-white transition-all bg-transparent border-none cursor-pointer">Daily</button>
          <button className="px-6 py-2 font-label-sm text-label-sm rounded-lg text-on-surface-variant hover:text-white transition-all bg-transparent border-none cursor-pointer">Weekly</button>
          <button className="px-6 py-2 font-label-sm text-label-sm rounded-lg bg-primary/20 text-primary border border-primary/20 shadow-sm transition-all cursor-pointer">Monthly</button>
        </div>
      </div>

      {loadError && <p className="text-error font-body-md mb-4">{loadError}</p>}

      {/* Bento Layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* Monthly Calendar Grid (Span 8) */}
        <div className="col-span-12 lg:col-span-8 glass-panel rounded-3xl p-8 animate-enter">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <h3 className="font-headline-md text-headline-md font-bold">{monthLabel}</h3>
              <div className="flex gap-2">
                <button onClick={goPrevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors bg-transparent border-none cursor-pointer text-on-surface">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button onClick={goNextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-colors bg-transparent border-none cursor-pointer text-on-surface">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Color Legend */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2 font-label-sm text-label-sm opacity-60">
                <span className="w-3 h-3 rounded-full bg-primary"></span> Present
              </div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm opacity-60">
                <span className="w-3 h-3 rounded-full bg-tertiary-container"></span> Half Day
              </div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm opacity-60">
                <span className="w-3 h-3 rounded-full bg-error"></span> Absent
              </div>
              <div className="flex items-center gap-2 font-label-sm text-label-sm opacity-60">
                <span className="w-3 h-3 rounded-full bg-secondary"></span> Leave
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {/* Days Header */}
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
              <div key={day} className="text-center font-label-sm text-label-sm opacity-40 pb-4">{day}</div>
            ))}

            {/* Blank days matching layout */}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} className="h-24 rounded-2xl bg-white/5 opacity-10"></div>
            ))}

            {/* Render Days */}
            {calendarDays.map((item) => {
              const style = item.status ? STATUS_STYLE[item.status] : null;
              const statusColors = style?.colors || 'bg-white/5 border-white/10';
              const indicatorColor = style?.indicator || 'bg-white/20';
              const statusText = style?.label || 'No Record';

              return (
                <div
                  key={item.day}
                  className={`group relative h-24 rounded-2xl border transition-all duration-300 hover:scale-[1.03] hover:z-20 cursor-pointer ${
                    item.isToday
                      ? 'border-primary shadow-[0_0_15px_rgba(104,218,185,0.3)] ring-1 ring-primary/50'
                      : 'border-white/10'
                  }`}
                >
                  <div className={`absolute inset-0 rounded-2xl ${statusColors} opacity-40`}></div>
                  <div className="relative p-3 h-full flex flex-col justify-between">
                    <span className={`font-label-sm text-label-sm ${item.isToday ? 'text-primary font-bold' : 'opacity-60'}`}>
                      {item.day}
                    </span>
                    <div className={`w-full h-1 rounded-full ${indicatorColor} opacity-50`}></div>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-label-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap shadow-xl border border-white/10 z-30">
                    Status: {statusText} <br /> Log: {item.log}
                  </div>
                </div>
              );
            })}
          </div>
          {loading && <p className="text-on-surface-variant font-label-sm text-label-sm mt-4">Loading…</p>}
        </div>

        {/* Clock In/Out Card + Summary (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="tilt-card glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group transition-all duration-300"
            id="check-in-card"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <span className="material-symbols-outlined text-6xl">schedule</span>
            </div>

            <h4 className="font-label-sm text-label-sm text-primary uppercase tracking-[0.2em] mb-6">Shift Timer</h4>

            {/* Progress Ring */}
            <div className="relative w-48 h-48 mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-white/5" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="6"></circle>
                <circle
                  className="text-primary progress-ring__circle"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray="251.2"
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  strokeWidth="6"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display-xl text-4xl font-bold tracking-tighter" id="live-clock">{timeString}</span>
                <span className="font-label-sm text-[10px] opacity-40 uppercase tracking-widest mt-1">Active Now</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] opacity-40 uppercase mb-1">Check In</p>
                <p className="font-label-sm text-sm font-bold">{formatClock(todayRecord?.check_in_time)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] opacity-40 uppercase mb-1">Total Hrs</p>
                <p className="font-label-sm text-sm font-bold">{isCheckedIn ? formatDuration(elapsedMs) : '00:00:00'}</p>
              </div>
            </div>

            {clockError && <p className="text-error text-[12px] font-body-md mb-3">{clockError}</p>}

            <button
              onClick={handleClockAction}
              disabled={isClockBusy || isCheckedOut}
              className="w-full py-4 bg-tertiary-container text-on-tertiary-container font-bold rounded-2xl shadow-xl shadow-tertiary-container/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">{isCheckedIn ? 'logout' : 'login'}</span>
              {isCheckedOut ? 'Shift Complete' : isCheckedIn ? 'Clock Out' : 'Clock In'}
            </button>
          </div>

          {/* Statistics Card */}
          <div className="glass-panel rounded-3xl p-6">
            <h4 className="font-label-sm text-label-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">analytics</span>
              Monthly Summary
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-body-md text-sm opacity-60">Days Present</span>
                <span className="font-label-sm text-sm">{presentDays}/{totalTrackedDays || 0}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full shadow-[0_0_8px_rgba(104,218,185,0.5)]" style={{ width: `${attendanceRate}%` }}></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-body-md text-sm opacity-60">Attendance Rate</span>
                <span className="font-label-sm text-sm text-primary">{attendanceRate}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full rounded-full shadow-[0_0_8px_rgba(255,175,211,0.5)]" style={{ width: `${attendanceRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
