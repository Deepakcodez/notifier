const CallingCard = ({callingTo}:{callingTo:string}) => {
  return (
    <div className="absolute top-4 left-[50%] bg-violet-200 border-violet-50 shadow-2xl shadow-violet-200 rounded-lg p-4">
        <h1>Calling to {callingTo}.....</h1>
    </div>
  )
}
export default CallingCard