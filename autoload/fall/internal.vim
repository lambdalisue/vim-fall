function! fall#internal#dispatch(event) abort
  if denops#plugin#wait('fall') isnot# 0
    return
  endif
  call denops#request('fall', 'event:dispatch', [a:event])
endfunction
