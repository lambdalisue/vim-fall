function! fall#internal#mapping#store() abort
  if exists('s:saved_maps')
    return
  endif
  let s:saved_maps = maplist()->filter({ _, m -> m.mode ==# 'c' || m.mode ==# '!' })
endfunction

" NOTE:
"
" It seems restore step must be called twice to restore the mappings correctly.
" Otherwise, mappings with recursive references are not restored correctly.
"
" For example:
"
" cnoremap <Up> <C-p>
" cnoremap <C-p> <Up>
"
function! fall#internal#mapping#restore()
  if !exists('s:saved_maps')
    return
  endif
  cmapclear
  call foreach(s:saved_maps, {_, m -> mapset(m)})
  call foreach(s:saved_maps, {_, m -> mapset(m)})
  unlet s:saved_maps
endfunction
