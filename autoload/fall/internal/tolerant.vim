function! fall#internal#tolerant#call(calback) abort
  try
    call a:calback()
  catch
    if &verbose
      echohl WarningMsg
      echomsg printf('[fall] Error on tolerant call: %s', v:exception)
      echohl None
    endif
  endtry
endfunction
