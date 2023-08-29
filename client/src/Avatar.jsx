export default function Avatar({userid, username, online}) {
    const colors = ['bg-red-200', 'bg-green-200', 'bg-purple-200', 'bg-blue-200', 'bg-yellow-200', 'bg-teal-200'];
    const useridBase10 = parseInt(userid, 14);
    const colorIndex = useridBase10 % colors.length;
    const color = colors[colorIndex];
    return (
        <div className={`w-8 h-8 relative bg-red-200 rounded-full flex items-center ${color}`}>
            <div className="text-center w-full opacity-70">{username?.[0] ?? ''}</div>
            {online && (
            <div className="absolute w-3 h-3 bottom-0.5 right-0 bg-green-400 rounded-full border border-white"></div>)
            }
            {!online && (
            <div className="absolute w-3 h-3 bottom-0.5 right-0 bg-gray-400 rounded-full border border-white"></div>)
            }
        </div>
    )
}