function! fall#internal#mapping#store() abort
  if exists('s:saved_maps')
    return
  endif
  let s:saved_maps = maplist()->filter({ _, m -> m.mode ==# 'c' || m.mode ==# '!' })
endfunction

function! fall#internal#mapping#restore() abort
  if !exists('s:saved_maps')
    return
  endif
  silent! cmapclear
  for l:m in s:saved_maps
    silent! call mapset(l:m)
  endfor
  silent! unlet s:saved_maps
endfunction
