function! fall#internal#popup#close(winid) abort
  call s:close(a:winid)
endfunction

if has('nvim')
  function! s:close(winid) abort
    call nvim_win_close(a:winid, v:true)
  endfunction
else
  function! s:close(winid) abort
    call popup_close(a:winid)
  endfunction
endif
