export default function StatCard({title,value,caption,icon:Icon,alert}){
  return <div className={`statCard ${alert?"alert":""}`}>
    <div className="statIcon">{Icon && <Icon size={20}/>}</div>
    <div>
      <span>{title}</span>
      <strong>{value}</strong>
      {caption && <small>{caption}</small>}
    </div>
  </div>
}
