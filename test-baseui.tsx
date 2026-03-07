import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
export function Test() {
  return <TooltipTrigger render={<Link href="/" />} />
}
