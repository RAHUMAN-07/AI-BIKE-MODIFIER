const ANGLES = [
  { id: 'front', name: 'Front', icon: '⬆️', description: 'Straight-on front view' },
  { id: 'left', name: 'Left Side', icon: '⬅️', description: 'Full left profile' },
  { id: 'rear', name: 'Rear', icon: '⬇️', description: 'Straight-on rear view' },
  { id: 'right', name: 'Right Side', icon: '➡️', description: 'Full right profile' },
  { id: 'quarter', name: '3/4 Angle', icon: '↗️', description: 'Front-left diagonal' },
];

export default function CaptureGuide() {
  return (
    <div className="capture-guide">
      {ANGLES.map((angle) => (
        <div key={angle.id} className="capture-guide__angle">
          <div className="capture-guide__icon">{angle.icon}</div>
          <span className="capture-guide__label">{angle.name}</span>
        </div>
      ))}
    </div>
  );
}
