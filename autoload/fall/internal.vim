function! fall#internal#dispatch(event) abort
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  call denops#notify('fall', 'event:dispatch', [a:event])
endfunction
