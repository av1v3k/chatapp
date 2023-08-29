import Avatar from "./Avatar";

export default function Contact({
  userid,
  username,
  setSelecteduserid,
  selecteduserid,
  online,
}) {
  return (
    <div
      onClick={() => setSelecteduserid(userid)}
      className={
        "border-b border-gray-100 flex gap-2 items-center cursor-pointer " +
        (userid === selecteduserid ? "bg-blue-100" : "")
      }
    >
      {userid === selecteduserid && (
        <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
      )}
      <div className="flex gap-2 py-2 pl-4 items-center">
        <Avatar online={online} username={username} userid={userid} />
        <span className="text-gray-800">{username}</span>
      </div>
    </div>
  );
}
