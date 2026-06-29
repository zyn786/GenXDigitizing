// @ts-nocheck
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { CouponInput } from "@/components/marketing/CouponInput";
import type { Coupon } from "@/types/coupon";

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";
const GREEN = {bg:"#10B981",bgSoft:"rgba(16,185,129,0.08)",border:"rgba(16,185,129,0.25)",icon:"#059669",text:"#047857"};

function Row({k,v,c}:{k:string;v:string;c?:string}){return(<div className="flex justify-between py-1.5 text-[13px]" style={{borderBottom:"1px solid var(--border)"}}><span style={{color:"var(--txt3)"}}>{k}</span><span className="font-bold" style={{color:c||"var(--txt)"}}>{v}</span></div>)}

export function Step4Confirm({sel,serviceName,selTurn,fmt,extras,designName,files,w,h,col,notes,qty,stitchCount,instructions,totalPrice,busy,placeOrder,setStep,couponCode,setCouponCode,appliedCoupon,discount,isApplying,couponError,applyCoupon,removeCoupon,uploadProgress,abortRef}:any){
  const effectiveTotal = appliedCoupon && discount > 0
    ? Math.max(0, totalPrice - discount * qty)
    : totalPrice;

  const isUploading = busy && uploadProgress > 0;

  return(
    <div className="rounded-2xl p-4 sm:p-5" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
      <h3 className="font-syne font-bold text-sm mb-3" style={{color:txt}}>Confirm your order</h3>

      {/* ═══ COUPON ═════════════════ */}
      <div className="mb-4">
        <CouponInput
          value={couponCode}
          onChange={setCouponCode}
          onApply={applyCoupon}
          onRemove={removeCoupon}
          appliedCoupon={appliedCoupon}
          discount={discount}
          isApplying={isApplying}
          error={couponError}
        />
      </div>

      <div className="rounded-xl p-3.5 mb-4" style={{background:"var(--elevated)",border:"1px solid var(--border)"}}>
        <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{color:txt3}}>Order Summary</p>
        <Row k="Service" v={serviceName||sel?.label}/>
        <Row k="Turnaround" v={selTurn?.icon+" "+selTurn?.label}/>
        <Row k="Format" v={fmt}/>
        {extras.length>0&&<Row k="Extra formats" v={extras.join(", ")}/>}
        <Row k="Design name" v={designName||"—"}/>
        <Row k="Dimensions" v={w+'" × '+h+'"'+(col?" · "+col+" colors":"")}/>
        <Row k="Files" v={files.length+" artwork file(s)"}/>
        <Row k="Notes" v={notes||"—"}/>
        {qty>1&&<Row k="Quantity" v={""+qty}/>}
        {stitchCount&&<Row k="Stitch count" v={stitchCount}/>}
        {instructions&&<Row k="Instructions" v={instructions}/>}
        {qty>1&&<Row k="Unit Price" v={"$"+Number(sel?.price||0).toFixed(0)+" × "+qty}/>}
        {appliedCoupon && discount > 0 && (
          <Row k={`Discount (${appliedCoupon.code})`} v={"- $"+(discount * qty).toFixed(2)} c={GREEN.text}/>
        )}
      </div>

      {/* Upload progress bar */}
      {isUploading && (
        <div className="mb-4 p-3 rounded-xl border" style={{background:"rgba(124,58,237,0.04)",borderColor:"rgba(124,58,237,0.2)"}}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold" style={{color:"#7C3AED"}}>Uploading artwork… {uploadProgress}%</span>
            <button
              onClick={() => abortRef?.current?.abort()}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border-none bg-transparent transition-colors"
              style={{color:"#B91C1C"}}
            >
              <X size={12}/> Cancel
            </button>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{background:"var(--elevated)"}}>
            <div className="h-full rounded-full transition-all duration-300" style={{
              width:`${uploadProgress}%`,
              background:"linear-gradient(90deg, #7C3AED, #D946EF)",
            }}/>
          </div>
        </div>
      )}

      <div className="rounded-xl p-3.5 mb-4 flex items-center justify-between" style={{background:GREEN.bgSoft,border:"1px solid "+GREEN.border}}>
        <div><span className="text-[13px] font-bold" style={{color:txt}}>Total{qty>1?" ("+qty+" items)":" "}</span><br/><span className="text-[10px]" style={{color:txt3}}>All turnaround speeds free · Unlimited revisions</span></div>
        <span className="font-syne font-bold text-2xl" style={{color:GREEN.text}}>${effectiveTotal.toFixed(0)}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>setStep(3)} disabled={busy} className="flex-1 py-3 rounded-xl text-[14px] sm:text-[13px] font-medium cursor-pointer border flex items-center justify-center gap-1.5" style={{background:"var(--elevated)",color:busy?txt3:txt2,borderColor:"var(--border2)",cursor:busy?"not-allowed":"pointer"}}><ArrowLeft size={15}/> Back</button>
        <button onClick={placeOrder} disabled={busy} className="flex-[2] py-3 rounded-xl text-[14px] sm:text-[13px] font-semibold border-none cursor-pointer text-white active:scale-[0.98] transition-all" style={{background:busy?"var(--border2)":"linear-gradient(135deg,"+GREEN.bg+","+GREEN.icon+")",cursor:busy?"not-allowed":"pointer"}}>{busy && !isUploading ? "Placing Order…" : busy ? "Uploading…" : "Place Order — $"+effectiveTotal.toFixed(0)}</button>
      </div>
    </div>
  );
}
