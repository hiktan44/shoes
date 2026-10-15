import {getAdminUser,pgQuery} from '@/lib/admin';
import {reportPeriod,readSummary} from '@/lib/subscriber-summary';
export const dynamic='force-dynamic';export const runtime='nodejs';
const headers={'cache-control':'private, no-store'};
export async function GET(request:Request){
 try{
  if(!await getAdminUser())return Response.json({error:'FORBIDDEN'},{status:403,headers});
  const q=new URL(request.url).searchParams;let period;
  try{period=reportPeriod(q.get('start'),q.get('end'));}catch{return Response.json({error:'INVALID_REPORT_PERIOD'},{status:400,headers});}
  return Response.json(await readSummary(pgQuery,period),{headers});
 }catch{return Response.json({error:'REPORT_SOURCE_UNAVAILABLE'},{status:503,headers});}
}
